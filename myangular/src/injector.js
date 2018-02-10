/* jshint globalstrict: true */
/* global angular: false */
'use strict';

/*
/ˆ We begin by anchoring the match to the beginning of input
function Every function begins with the function keyword. . .
\s* . . . followed by (optionally) some whitespace. . .
[ˆ\(]* . . . followed by the (optional) function name - characters other than ‘(’. . .
\( . . . followed by the opening parenthesis of the argument list. . .
\s* . . . followed by (optionally) some whitespace. . .
( . . . followed by the argument list, which we capture in a capturing group. . .
[ˆ\)]* . . . into which we read a succession of any characters other than ‘)’. . .
) . . . and when done reading we close the capturing group. . .
\) . . . and still match the closing parenthesis of the argument list. . .
/m . . . and define the whole regular expression to match over multiple lines
*/
// 提取函数的参数
var FN_ARGS=/^function\s*[^\(]*\(\s*([^\)]*)\)/m;

// 除去空格
// 后向引用，表示表达式中，从左往右数，第一个左括号对应的括号内的内容。
// 以此类推，\2表示第二个，\0表示整个表达式
var FN_ARG=/^\s*(_?)(\S+?)\1\s*$/;

// a.*b，它将会匹配最长的以a开始，以b结束的字符串。如果用它来搜索aabab的话，它会匹配整个字符串aabab。这被称为贪婪匹配。
// a.*?b匹配最短的，以a开始，以b结束的字符串。如果把它应用于aabab的话，它会匹配aab（第一到第三个字符）和ab（第四到第五个字符）
var STRIP_COMMENTS=/(\/\/.*$)|(\/\*.*?\*\/)/mg;

var INSTANTIATING={};

function createInjector(modulesToLoad,strictDi){
	var providerCache={};
	var instanceCache={};
	var loadedModules={};
	var path=[];
	strictDi=(strictDi===true);

	function getService(name){
		if(instanceCache.hasOwnProperty(name)){
			if(instanceCache[name]===INSTANTIATING){
				throw new Error('Circular dependency found: '+
					name + ' <- ' + path.join(' <- '));
			}
			return instanceCache[name];
		}else if(providerCache.hasOwnProperty(name+'Provider')){
			path.unshift(name);
			instanceCache[name]=INSTANTIATING;
			try{
				var provider=providerCache[name+'Provider'];
				var instance=instanceCache[name]=invoke(provider.$get);
				return instance;
			}finally{
				path.shift();
				if(instanceCache[name]===INSTANTIATING){
					delete instanceCache[name];
				}
			}
		}
	}

	function instantiate(Type,locals){
		var UnwrappedType=_.isArray(Type)?_.last(Type):Type;
		var instance=Object.create(UnwrappedType.prototype);
		invoke(Type,instance,locals);
		return instance;
	}

	var $provide={
		constant:function(key,value){
			if(key==='hasOwnProperty'){
				throw 'hasOwnProperty is not a valid constant name!';
			}
			instanceCache[key]=value;
		},
		provider:function(key,provider){
			if(_.isFunction(provider)){
				provider=instantiate(provider);
			}
			providerCache[key+'Provider']=provider;
		}
	};

	function annotate(fn){
		if(_.isArray(fn)){
			return fn.slice(0,fn.length-1);
		}else if(fn.$inject){
			return fn.$inject;
		}else if(!fn.length){
			return [];
		}else{
			if(strictDi){
				throw 'fn is not using explicit annotation and '+
					  'cannot be invoked in strict mode';
			}
			var source=fn.toString().replace(STRIP_COMMENTS,'');
			var argDeclaration=source.match(FN_ARGS);
			return _.map(argDeclaration[1].split(','),function(argName){
				return argName.match(FN_ARG)[2];
			});
		}
	}

	function invoke(fn,self,locals){
		var args=_.map(annotate(fn),function(token){
			if(_.isString(token)){
				return locals && locals.hasOwnProperty(token)?
					locals[token]:
				    getService(token); 
			}else{
				throw 'Incorrect injection token!Expected a string,got '+token;
			}
			
		});
		if(_.isArray(fn)){
			fn=_.last(fn);
		}
		return fn.apply(self,args);
	}

	_.forEach(modulesToLoad,function loadModule(moduleName){
		if(!loadedModules.hasOwnProperty(moduleName)){
			loadedModules[moduleName]=true;
			var module=angular.module(moduleName);
			_.forEach(module.requires,loadModule);
			_.forEach(module._invokeQueue,function(invokeArgs){
				var method=invokeArgs[0];
				var args=invokeArgs[1];
				$provide[method].apply($provide,args);
			});
		}
		
	});
	return {
		has:function(key){
			return instanceCache.hasOwnProperty(key) ||
				providerCache.hasOwnProperty(key+'Provider');
		},
		get:getService,
		annotate:annotate,
		invoke:invoke,
		instantiate:instantiate
	};
}
