/* jshint globalstrict: true */
/* global setupModuleLoader: false */
'use strict';

describe('setupModuleLoader',function(){

	// 在其他操作前线删除这个angular属性
	beforeEach(function(){
		delete window.angular;
	});
	// The angular Global
	it('exposes angular on the window',function(){
		setupModuleLoader(window);
		expect(window.angular).toBeDefined();
	});

	// Initializing The Global Just Once
	it('creates angular just once',function(){
		setupModuleLoader(window);
		var ng=window.angular;
		setupModuleLoader(window);
		expect(window.angular).toBe(ng);
	});

	// The module Method
	it('exposes the angular module function',function(){
		setupModuleLoader(window);
		expect(window.angular.module).toBeDefined();
	});

	it('exposes the angular module function just once',function(){
		setupModuleLoader(window);
		var module=window.angular.module;
		setupModuleLoader(window);
		expect(window.angular.module).toBe(module);
	});

	// Registering A Module
	describe('modules',function(){
		beforeEach(function(){
			setupModuleLoader(window);
		});

		it('allows registering a module',function(){
			var myModule=window.angular.module('myModule',[]);
			expect(myModule).toBeDefined();
			expect(myModule.name).toEqual('myModule');
		});

		it('replaces a module when registered with same name again',function(){
			var myModule=window.angular.module('myModule',[]);
			var myNewModule=window.angular.module('myModule',[]);
			expect('myNewModule').not.toBe(myModule);
		});

		it('attaches the requires array to the registered module',function(){
			var myModule=window.angular.module('myModule',['myOtherModule']);
			expect(myModule.requires).toEqual(['myOtherModule']);
		});

		// Getting A Registered Module
		it('allows getting a module',function(){
			var myModule=window.angular.module('myModule',[]);
			var gotModule=window.angular.module('myModule');

			expect(gotModule).toBeDefined();
			expect(gotModule).toBe(myModule);
		});

		it('throws when trying to get a nonexistent module',function(){
			expect(function(){
				window.angular.module('myModule');
			}).toThrow();
		});

		it('does not allow a module to be called hasOwnProperty',function(){
			expect(function(){
				window.angular.module('hasOwnProperty',[]);
			}).toThrow();
		});




	});
});