import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';

export default {
	entry: './src/index.js',
	output: {
		path: path.resolve(process.cwd(), 'dist'),
		filename: 'bundle.js',
		clean: true,
	},
	module: {
		rules: [
			{
				test: /\.jsx?$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
				},
			},
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader', 'postcss-loader'],
			},
		],
	},
	resolve: {
		extensions: ['.js', '.jsx'],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: 'index.html',
		}),
	],
	devServer: {
		static: {
			directory: path.join(process.cwd(), 'dist'),
		},
		port: 3000,
		open: true,
	},
};
