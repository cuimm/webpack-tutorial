console.log('bable-plugin-example');

/**
 * 1、根据babel配置文件转换变量名
 * 2、将let转为const
 * 3、删除console.log日志信息
 *
 * 函数会有一个 babelTypes 参数，我们结构出里面的 types
 * 代码中需要用到它的一些方法，方法具体什么意思可以参考 https://babeljs.io/docs/en/next/babel-types.html
 */
module.exports = function ({types}) {
  return {
    visitor: {
      /**
       * 负责处理所有节点类型为 Identifier 的AST节点
       * @param path AST节点的路径信息，可以简单理解为里面放了AST节点的各种信息
       * @param state 有一个很重要的 state.opts，是 .babelrc 中的该插件的配置项 { a: 'aa', b: 'bb' }
       * @constructor
       */
      Identifier(path, state) {
        const node = path.node;  // 节点信息
        const name = node.name;  // 从节点信息中拿到name属性，即a和b
        // 如果配置项中存在 name 属性，则将 path.node.name 的值替换为配置项中的值
        if (state.opts[name]) {
          path.node.name = state.opts[name];
        }
      },

      /**
       * 处理变量声明关键字
       * @param path
       * @param state
       * @constructor
       */
      VariableDeclaration(path, state) {
        // 这次就没从配置文件读了，来个简单的，直接改
        path.node.kind = 'const';
      },

      ExpressionStatement(path, state) {
        const expression = path.node.expression;
        // 判断当前expression是否是CallExpression
        if (types.isCallExpression(expression)) {
          const callee = expression.callee;
          if (types.isMemberExpression(callee)) {
            const objectName = callee.object.name;
            const methodName = callee.property.name;
            if (objectName === 'console' && methodName === 'log') {
              path.remove(); // 删除该节点
            }
          }
        }
      },
    }
  }
}

/*
输入:
  let a = 1
  let b = 2
运行:
  npx babel index.js
输出:
  const aa = 1
  const bb = 2
* */

// ast: https://astexplorer.net/
// https: //juejin.cn/post/6847902223629090824#heading-23
