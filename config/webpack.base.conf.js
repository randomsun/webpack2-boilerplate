const webpack = require('webpack')
const { resolve } = require('path')
const config = require('./config')

const rootPath = resolve(__dirname, '..')
const src = resolve(rootPath, 'src')

module.exports = {
  // 入口配置
  entry: {
    index: resolve(src, 'index')
    /**
    * vendor 用于存储第三方库
    * 为什么不直接把第三方库，直接罗列在这，而是使用vendor.js文件？
    * 使用vendor.js可以在增加第三方库的时候，不用修改配置文件，直接在vendor.js中import就可以了
    */
    /**
    * 在没有CommonsChunkPlugin时，entry配置的最后一项，会作为应用的入口文件
    * 如果存在CommonsChunkPlugin，那么最后一个由CommonsChunkPlugin打包出来的文件作为应用入口文件。
    */
    // 改为隐式提取第三方库文件，所以本行注释掉了。
    // vendor: './src/vendor'
  },
  output: {
    // path 打包之后输出的目录
    path: resolve(rootPath, 'dist'),
    /**
    * filename 根据entry项配置，打包输出的文件名
    * entry有几个输入项，就会打包出几个文件。
    */
    /**
    * chunkhash 是指根据文件内容生产的哈希值
    * 文件内容不变，哈希值就不会变，所以可以使用chunkhash配合浏览器缓存
    */
    filename: '[name].js',
    // 应用发布时的路径，决定了index.html中入口文件的rul。
    publicPath: process.env.NODE_ENV === 'production'
      ? config.build.publicPath
      : config.dev.publicPath,
    // chunkFilename 代码分割时，产生的chunk文件的名字
    chunkFilename: '[chunkhash].[id].js'
  },
  module: {
    // noParse 使webpack不解析匹配正则的文件，这些文件中不应该包含import，require，define等语句。如果该文件依赖其他文件，依赖文件不会被打包进bundle。
    // 配合alias，提高构建性能。
    noParse: [/react|react-dom/],
    // rules 当import或require模块时，根据文件类型匹配loader。
    rules: [
      {
        test: /\.jsx?$/,
        include: [src, resolve(rootPath, 'test')],
        use: ['babel-loader', 'eslint-loader']
      },
      {
        test: /\.(html)$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              /* html-loader，支持attrs选项，表示什么标签的什么属性需要调用webpack的loader进行打包.
              比如<img>标签的src属性, webpack会把<img>引用的图片打包, 然后src的属性值替换为打包后的路径.
              如果html-loader不指定attrs参数, 默认值是img:src
              */
              attrs: ['img:src'],
              minimize: true
              /*
              root项，支持定义根目录
              将根目录定义为src，<img src="/favicon.png">, 然后就会顺利的找到src下的favicon.png
              */
              // root: resolve(rootPath, 'src')
            }
          }
        ]
      },
      {
        // test: /\.scss$/,
        // // 使用post-css的autoprefixer，自动给css添加前缀。
        // use: ['style-loader', 'css-loader', 'sass-loader']
        // use: ExtractTextPlugin.extract({
        //   use: ['css-loader', 'postcss-loader', 'sass-loader'],
        //   fallback: 'style-loader'
        // })
      },
      {
        test: /\.(png|jpg|jpeg|gif|eot|ttf|woff|woff2|svg|svgz)(\?.+)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000
              // TODO: 将图片等资源生产到img/下
            }
          }
        ]
      }
    ]
  },
  /**
  * resolve 定义别名
  *
  */
  resolve: {
    extensions: ['.js', 'jsx', '.json', 'less', 'scss', 'css'],
    alias: {
      /*
      将src目录定义为 ~ ,这样在模块中import其他模块时，如果模块的相对路径很深，那就可以使用 ~
      比如：a中引用b
      import b from '../../../components/b'
      可以使用 ~ 来简化
      import b from '~/components/b'
      */
      '~': resolve(rootPath, 'src'),
      // 使用min文件，能够有效减少打包依赖个数，提升性能。  http://code.oneapm.com/javascript/2015/07/07/webpack_performance_1/
      react: 'react/dist/react.min',
      'react-dom': 'react-dom/dist/react-dom.min',
      utils: resolve(rootPath, 'utils')
    }
  },
  /**
   * 防止将某些 import 的包(package)打包到 bundle 中，而是在运行时(runtime)再去从外部获取这些扩展依赖
   */
  externals: {
    /**
     * 将jQuery定义为全局变量
     * eg: import $ from 'jquery' 相当于从jQuery引入$
     */
    // jquery: 'jQuery'
  },
  plugins: [
    /**
     * 使用指定变量时，可以自动import 对应的包
     */
    new webpack.ProvidePlugin({
      // 直接在文件中使用$，webpack会自动帮你加入import $ from 'jquery'
      // $: 'jquery'
      Promise: 'es6-promise',
      fetch: 'imports-loader?this=>global!exports-loader?global.fetch!whatwg-fetch'
    }),
    /**
     * 自定义全局变量，这样就可以在业务代码中使用定义的变量
     * eg: 判断当前环境是生产还是线上
     * const isProduction = (() => {
         return process.env.NODE_ENV === 'production';
       })()
     */
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': process.env.NODE_ENV,
      __DEV__: process.env.NODE_ENV === 'development'
    })
  ]
}
