const CracoLess = require("craco-less");
const CracoCSSModules = require("craco-css-modules");
const path = require("path");
module.exports = {
  babel: {
    plugins: [
      // antd 按需加载
      [
        "import",
        {
          libraryName: "antd",
          libraryDirectory: "es",
          style: true,
        },
      ],
    ],
  },
  plugins: [
    {
      plugin: CracoLess,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            javascriptEnabled: true,
          },
        },
      },
    },
    { plugin: CracoCSSModules },
  ],
  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src/"), // 设置路径别名 '@' 为 'src/' 目录
    },
  },
  style: {
    postcss: {
      mode: "extends",
      loaderOptions: {
        postcssOptions: {
          ident: "postcss",
          plugins: [
            [
              "postcss-pxtorem",
              {
                rootValue: 1800 / 10, // 根元素字体大小
                propList: ["*"],
                minPixelValue: 2, // 设置要替换的最小像素值。
                exclude: /node_modules/i, // 排除 node_modules 文件(node_modules 内文件禁止转换)
              },
            ],
          ],
        },
      },
    },
  },
  devServer: {
    client: {
      progress: true,
      overlay: false,
    },
    port: 5002,
    proxy: {
      "/stu": {
        // target: "http://192.168.0.163:9012", // 你的API服务器URL AI服务器
        // target: "http://localhost:9002", // 你的API服务器URL
        target: "http://117.72.14.166:9002", // 你的API服务器URL
        // target: "http://192.168.1.100:9001",
        changeOrigin: true,
        pathRewrite: {
          "^/stu": "/stu", // 如果你的API接口前缀是'/api'，这里可以去掉
        },
      },
    },
  },
};
