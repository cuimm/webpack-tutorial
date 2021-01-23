/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var fs = require("fs");
var readFile = fs.readFile.bind(fs);
var loadLoader = require("./loadLoader");

function utf8BufferToString(buf) {
  var str = buf.toString("utf-8");
  if (str.charCodeAt(0) === 0xFEFF) {
    return str.substr(1);
  } else {
    return str;
  }
}

// 匹配 ./src/index.js?name=cuimm#pos=top
const PATH_QUERY_FRAGMENT_REGEXP = /^((?:\0.|[^?#\0])*)(\?(?:\0.|[^#\0])*)?(#.*)?$/;

/**
 * 解析文件路径、参数、#
 * @param {string} str the path with query and fragment
 * @returns {{ path: string, query: string, fragment: string }} parsed parts
 */
function parsePathQueryFragment(str) {
  var match = PATH_QUERY_FRAGMENT_REGEXP.exec(str);
  return {
    path: match[1].replace(/\0(.)/g, "$1"), //
    query: match[2] ? match[2].replace(/\0(.)/g, "$1") : "", //
    fragment: match[3] || "" // #pos
  };
}

function dirname(path) {
  if (path === "/") return "/";
  var i = path.lastIndexOf("/");
  var j = path.lastIndexOf("\\");
  var i2 = path.indexOf("/");
  var j2 = path.indexOf("\\");
  var idx = i > j ? i : j;
  var idx2 = i > j ? i2 : j2;
  if (idx < 0) return path;
  if (idx === idx2) return path.substr(0, idx + 1);
  return path.substr(0, idx);
}

function createLoaderObject(loader) {
  var obj = {
    path: null, // 当前loader的绝对路径
    query: null, // 当前loader的查询参数
    fragment: null, // 当前loader的片段
    options: null,
    ident: null,
    normal: null, // 当前loader的normal函数
    pitch: null, // 当前loader的pitch函数
    raw: null, // 是否为Buffer
    data: null, // 自定义对象（每个loader都有一个自定义对象，可用于normal和pitch函数之间传值）
    pitchExecuted: false, // 当前loader的pitch函数是否已经执行
    normalExecuted: false // 当前loader的normal函数是否已经执行
  };
  Object.defineProperty(obj, "request", {
    enumerable: true,
    get: function () {
      return obj.path.replace(/#/g, "\0#") + obj.query.replace(/#/g, "\0#") + obj.fragment;
    },
    set: function (value) {
      if (typeof value === "string") {
        var splittedRequest = parsePathQueryFragment(value);
        obj.path = splittedRequest.path;
        obj.query = splittedRequest.query;
        obj.fragment = splittedRequest.fragment;
        obj.options = undefined;
        obj.ident = undefined;
      } else {
        if (!value.loader)
          throw new Error("request should be a string or object with loader and options (" + JSON.stringify(value) + ")");
        obj.path = value.loader;
        obj.fragment = value.fragment || "";
        obj.type = value.type;
        obj.options = value.options;
        obj.ident = value.ident;
        if (obj.options === null)
          obj.query = "";
        else if (obj.options === undefined)
          obj.query = "";
        else if (typeof obj.options === "string")
          obj.query = "?" + obj.options;
        else if (obj.ident)
          obj.query = "??" + obj.ident;
        else if (typeof obj.options === "object" && obj.options.ident)
          obj.query = "??" + obj.options.ident;
        else
          obj.query = "?" + JSON.stringify(obj.options);
      }
    }
  });
  obj.request = loader;
  if (Object.preventExtensions) {
    Object.preventExtensions(obj);
  }
  return obj;
}

/**
 *
 * @param fn pitch or normal
 * @param context loader上下文
 * @param args [remainingRequest, previousRequest, data]
 * @param callback
 * @returns {*}
 */
function runSyncOrAsync(fn, context, args, callback) {
  var isSync = true;  // 是否异步
  var isDone = false; // 是否完成,是否执行过此函数了,默认是false
  var isError = false; // internal error
  var reportedError = false;
  // context.async：loader内部调用this.async可以把同步变成异步，表示这个loader里的代码是异步的
  context.async = function async() {
    if (isDone) {
      if (reportedError) return; // ignore
      throw new Error("async(): The callback was already called.");
    }
    isSync = false; // 改为异步
    return innerCallback;
  };
  var innerCallback = context.callback = function () {
    if (isDone) {
      if (reportedError) return; // ignore
      throw new Error("callback(): The callback was already called.");
    }
    isDone = true;  // 表示当前函数已经完成
    isSync = false;
    try {
      callback.apply(null, arguments); // 执行回调
    } catch (e) {
      isError = true;
      throw e;
    }
  };
  try {
    var result = (function LOADER_EXECUTION() {
      return fn.apply(context, args); // 执行pitch/normal。pitch/normal的this绑定loader上下文对象。第二个参数：pitch方法为[remainingRequest, previousRequest, data], normal方法为资源文件
    }());
    if (isSync) {
      isDone = true;
      if (result === undefined)
        return callback();
      if (result && typeof result === "object" && typeof result.then === "function") { // 返回的可能是一个promise
        return result.then(function (r) {
          callback(null, r);
        }, callback);
      }
      return callback(null, result); // result有返回值，传到第二个参数内部
    }
  } catch (e) {
    if (isError) throw e;
    if (isDone) {
      // loader is already "done", so we cannot use the callback function
      // for better debugging we print the error on the console
      if (typeof e === "object" && e.stack) console.error(e.stack);
      else console.error(e);
      return;
    }
    isDone = true;
    reportedError = true;
    callback(e);
  }
}

function convertArgs(args, raw) {
  if (!raw && Buffer.isBuffer(args[0])) // 如果当前loader不需要buffer，但是args[0]是buffer => 转成string
    args[0] = utf8BufferToString(args[0]);
  else if (raw && typeof args[0] === "string") // 如果当前loader需要buffer，但是args[0]是个字符串 => 转成buffer
    args[0] = Buffer.from(args[0], "utf-8");
}

/**
 * 迭代pitch
 * @param options
 * @param loaderContext
 * @param callback
 * @returns {*}
 */
function iteratePitchingLoaders(options, loaderContext, callback) {
  // abort after last loader
  if (loaderContext.loaderIndex >= loaderContext.loaders.length)
    return processResource(options, loaderContext, callback);

  // 当前loader
  var currentLoaderObject = loaderContext.loaders[loaderContext.loaderIndex];

  // iterate
  if (currentLoaderObject.pitchExecuted) {
    loaderContext.loaderIndex++;
    return iteratePitchingLoaders(options, loaderContext, callback);
  }

  // load loader module
  loadLoader(currentLoaderObject, function (err) {
    if (err) {
      loaderContext.cacheable(false);
      return callback(err);
    }
    var fn = currentLoaderObject.pitch;
    currentLoaderObject.pitchExecuted = true;
    if (!fn) return iteratePitchingLoaders(options, loaderContext, callback);

    runSyncOrAsync(
        fn, // 要执行的pitch函数
        loaderContext,
        [loaderContext.remainingRequest, loaderContext.previousRequest, currentLoaderObject.data = {}], // 传递给pitchFunction的参数数组
        function (err) {
          if (err) return callback(err);
          var args = Array.prototype.slice.call(arguments, 1);
          // Determine whether to continue the pitching process based on
          // argument values (as opposed to argument presence) in order
          // to support synchronous and asynchronous usages.
          var hasArg = args.some(function (value) {
            return value !== undefined;
          });
          if (hasArg) {  // hasArg有值，说明pitch有返回值：掉转枪头，执行上一个loader的normal函数；否则继续执行下一个loader的pitch
            loaderContext.loaderIndex--;
            iterateNormalLoaders(options, loaderContext, args, callback);
          } else {
            iteratePitchingLoaders(options, loaderContext, callback);
          }
        }
    );
  });
}

/**
 * 读取资源文件
 * @param options
 * @param loaderContext
 * @param callback
 */
function processResource(options, loaderContext, callback) {
  // set loader index to last loader
  // 重置loaderIndex 改为loader的长度减1
  loaderContext.loaderIndex = loaderContext.loaders.length - 1;

  var resourcePath = loaderContext.resourcePath;
  if (resourcePath) {
    // 调用fs.readFile方法读取资源内容
    options.processResource(loaderContext, resourcePath, function (err, buffer) {
      if (err) return callback(err);
      options.resourceBuffer = buffer; // resourceBuffer放的是资源的原始内容
      iterateNormalLoaders(options, loaderContext, [buffer], callback);
    });
  } else {
    iterateNormalLoaders(options, loaderContext, [null], callback);
  }
}

/**
 * 迭代normal
 * @param options
 * @param loaderContext
 * @param args 资源文件
 * @param callback
 * @returns {*}
 */
function iterateNormalLoaders(options, loaderContext, args, callback) {
  // loader全部执行完毕
  if (loaderContext.loaderIndex < 0)
    return callback(null, args);

  var currentLoaderObject = loaderContext.loaders[loaderContext.loaderIndex];

  // iterate
  if (currentLoaderObject.normalExecuted) {
    loaderContext.loaderIndex--;
    return iterateNormalLoaders(options, loaderContext, args, callback);
  }

  var fn = currentLoaderObject.normal;
  currentLoaderObject.normalExecuted = true;
  if (!fn) {
    return iterateNormalLoaders(options, loaderContext, args, callback);
  }

  convertArgs(args, currentLoaderObject.raw);

  runSyncOrAsync(fn, loaderContext, args, function (err) {
    if (err) return callback(err);

    var args = Array.prototype.slice.call(arguments, 1);
    iterateNormalLoaders(options, loaderContext, args, callback);
  });
}

exports.getContext = function getContext(resource) {
  var path = parsePathQueryFragment(resource).path;
  return dirname(path);
};

exports.runLoaders = function runLoaders(options, callback) {
  // read options '/Users/xxx/code/webpack/loader/src/index.js'
  // 要解析的文件的绝对路径
  var resource = options.resource || "";
  /*
  loaders的数组
  {
    loader: '/Users/xxx/node_modules/vue-loader/lib/selector.js',
    options: 'type=script&index=0'
  }
  * */
  var loaders = options.loaders || [];
  // 创建loader执行上下文 loader的normal和pitch函数调用时this指向该loaderContext
  var loaderContext = options.context || {};
  var processResource = options.processResource || ((readResource, context, resource, callback) => {
    context.addDependency(resource);
    readResource(resource, callback);
  }).bind(null, options.readResource || readFile);

  // splittedResource = {path:'', query:'', fragment:''}
  var splittedResource = resource && parsePathQueryFragment(resource);
  var resourcePath = splittedResource ? splittedResource.path : undefined;  // 要解析的文件路径 ./src/index.js
  var resourceQuery = splittedResource ? splittedResource.query : undefined; // 要解析的文件的查询参数 name=cuimm
  var resourceFragment = splittedResource ? splittedResource.fragment : undefined; // 要解析的文件的片段 #pos=top
  var contextDirectory = resourcePath ? dirname(resourcePath) : null; // 要解析的文件所在的上下文目录 ./src

  // execution state
  var requestCacheable = true;
  var fileDependencies = [];
  var contextDependencies = [];
  var missingDependencies = [];

  // prepare loader objects
  // 准备loader数组
  // => 每个loader都有{path:'', query:'', fragment:'', normal: '', pitch: '', raw: '', request: ''}等属性
  loaders = loaders.map(createLoaderObject);

  loaderContext.context = contextDirectory; // 要解析的文件所在上下文目录
  loaderContext.loaderIndex = 0; // 当前执行到的loader的下标
  loaderContext.loaders = loaders; // loaders数组
  loaderContext.resourcePath = resourcePath; // 要解析的文件路径
  loaderContext.resourceQuery = resourceQuery; // 要解析的文件的查询参数
  loaderContext.resourceFragment = resourceFragment; // 要解析的文件的片段
  loaderContext.async = null;  // async是一个方法，可以让一个loader的执行从同步变为异步
  loaderContext.callback = null; // 调用下一个loader
  loaderContext.cacheable = function cacheable(flag) {
    if (flag === false) {
      requestCacheable = false;
    }
  };
  loaderContext.dependency = loaderContext.addDependency = function addDependency(file) {
    fileDependencies.push(file);
  };
  loaderContext.addContextDependency = function addContextDependency(context) {
    contextDependencies.push(context);
  };
  loaderContext.addMissingDependency = function addMissingDependency(context) {
    missingDependencies.push(context);
  };
  loaderContext.getDependencies = function getDependencies() {
    return fileDependencies.slice();
  };
  loaderContext.getContextDependencies = function getContextDependencies() {
    return contextDependencies.slice();
  };
  loaderContext.getMissingDependencies = function getMissingDependencies() {
    return missingDependencies.slice();
  };
  loaderContext.clearDependencies = function clearDependencies() {
    fileDependencies.length = 0;
    contextDependencies.length = 0;
    missingDependencies.length = 0;
    requestCacheable = true;
  };
  Object.defineProperty(loaderContext, "resource", {
    enumerable: true,
    get: function () {
      if (loaderContext.resourcePath === undefined)
        return undefined;
      return loaderContext.resourcePath.replace(/#/g, "\0#") + loaderContext.resourceQuery.replace(/#/g, "\0#") + loaderContext.resourceFragment;
    },
    set: function (value) {
      var splittedResource = value && parsePathQueryFragment(value);
      loaderContext.resourcePath = splittedResource ? splittedResource.path : undefined;
      loaderContext.resourceQuery = splittedResource ? splittedResource.query : undefined;
      loaderContext.resourceFragment = splittedResource ? splittedResource.fragment : undefined;
    }
  });
  Object.defineProperty(loaderContext, "request", {
    enumerable: true,
    get: function () {
      return loaderContext.loaders.map(function (o) {
        return o.request;
      }).concat(loaderContext.resource || "").join("!");
    }
  });
  Object.defineProperty(loaderContext, "remainingRequest", {
    enumerable: true,
    get: function () {
      if (loaderContext.loaderIndex >= loaderContext.loaders.length - 1 && !loaderContext.resource)
        return "";
      return loaderContext.loaders.slice(loaderContext.loaderIndex + 1).map(function (o) {
        return o.request;
      }).concat(loaderContext.resource || "").join("!");
    }
  });
  Object.defineProperty(loaderContext, "currentRequest", {
    enumerable: true,
    get: function () {
      return loaderContext.loaders.slice(loaderContext.loaderIndex).map(function (o) {
        return o.request;
      }).concat(loaderContext.resource || "").join("!");
    }
  });
  Object.defineProperty(loaderContext, "previousRequest", {
    enumerable: true,
    get: function () {
      return loaderContext.loaders.slice(0, loaderContext.loaderIndex).map(function (o) {
        return o.request;
      }).join("!");
    }
  });
  Object.defineProperty(loaderContext, "query", {
    enumerable: true,
    get: function () {
      var entry = loaderContext.loaders[loaderContext.loaderIndex];
      return entry.options && typeof entry.options === "object" ? entry.options : entry.query;
    }
  });
  Object.defineProperty(loaderContext, "data", {
    enumerable: true,
    get: function () {
      return loaderContext.loaders[loaderContext.loaderIndex].data;
    }
  });

  // finish loader context
  if (Object.preventExtensions) {
    Object.preventExtensions(loaderContext);
  }

  var processOptions = {
    resourceBuffer: null,
    processResource: processResource
  };
  iteratePitchingLoaders(processOptions, loaderContext, function (err, result) {
    if (err) {
      return callback(err, {
        cacheable: requestCacheable,
        fileDependencies: fileDependencies,
        contextDependencies: contextDependencies,
        missingDependencies: missingDependencies
      });
    }
    callback(null, {
      result: result,
      resourceBuffer: processOptions.resourceBuffer,
      cacheable: requestCacheable,
      fileDependencies: fileDependencies,
      contextDependencies: contextDependencies,
      missingDependencies: missingDependencies
    });
  });
};
