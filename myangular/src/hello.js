function sayHello(to){
	// return 'Hello,world!';
	// 验证使用Lo-Dash
	return _.template('Hello,<%= name %>!')({name:to});
}