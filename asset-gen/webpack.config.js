const path = require('path');
const WebpackShellPluginNext = require('webpack-shell-plugin-next');

module.exports = {
	entry: './src/crops.tsx',
	devtool: 'source-map',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
	output: {
		filename: 'crops.js',
		path: path.resolve(__dirname, 'dist'),
	},
	plugins: [
		new WebpackShellPluginNext({
			onBuildStart: {
				scripts: ['echo "Webpack Start"'],
				blocking: true,
				parallel: false
			},
			onAfterDone: {
				scripts: ['pwd', 'cp dist/crops* ../static"'],
				blocking: true,
				parallel: false
			}
		}),
	],
};
