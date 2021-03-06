/*
	To Do
		- shadbox behaves funny on chrome
			- could just be if console is open


1078488011
<script type="text/ace-instagram">{
	query: 'users/227962011/media/recent'
}</script>

hopechapel_lb
<script type="text/ace-twitter">{
	screenName: 'jewelmint'
	,numGet: 10
	,numShow: 3
	,scroll: 'y'
	,type: 'sidebar'
}</script>

<script type="text/ace-soundcloud-playlist">{
	playlistId: '29344655'
	,numShow: 3
}</script>

<script type="text/ace-insert">{
	where: {
		closest: '.widget'
		,find: '.widget-head'
	}
	,action: 'prepend'
	,what: {
		content: '<div class="widget-head-rightflow"><a href="/listen">View all</a></div>'
	}
}</script>


<div class="donate">
<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
<input type="hidden" name="cmd" value="_s-xclick">
<input type="hidden" name="hosted_button_id" value="XWXH8X2V9TGPG">
<input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">
</form>
</div>

*/


AceBase = function(){
	this._evts = {};
}
AceBase.prototype.on = function(key,cb){
	var evt = this._getEvt(key);
	evt.subs.push({
		cb: cb
	});
}
AceBase.prototype.ready = function(key,cb){
	var evt = this._getEvt(key);
	if (evt.firedOnce) {
		cb(evt.error,evt.data);
	} else {
		evt.subs.push({
			cb: cb,
			typeReady: true
		});
	}
}
AceBase.prototype.off = function(key,cb){
	var z = this
		,evt
	;
	if (!z._evts[key]) return;
	evt = z._getEvt(key);
	if (typeof(cb) == 'undefined') {
		evt.subs = [];
	} else {
		$.each(evt.subs,function(i,sub){
			// checking !sub in case this is called in callback inside fireSubs
			if (!sub || sub.cb == cb)
				evt.subs[i] = null;
		});
		ace.util.arrayFilter(evt.subs,function(sub){
			return sub !== null;
		});
	}
}
AceBase.prototype.trigger = function(key,error,data){
	var evt = this._getEvt(key);
	evt.firedOnce = true;
	evt.error = error;
	evt.data = data;
	this._fireSubs(key);
}
AceBase.prototype._getEvt = function(key){
	if (typeof(this._evts[key]) == 'undefined') {
		this._evts[key] = {
			subs: []
		};
	}
	return this._evts[key];
}
AceBase.prototype._fireSubs = function(key){
	var evt = this._getEvt(key);
	$.each(evt.subs.slice(0),function(i,sub){
		sub.cb(evt.error,evt.data);
	});
	$.each(evt.subs,function(i,sub){
		if (sub.typeReady)
			evt.subs[i] = null;
	});
	ace.util.arrayFilter(evt.subs,function(sub){
		return sub !== null;
	});
}
AceBase.prototype.log = function(){
	var args = [this.key||'anonymous AceBase'];
	$.each(arguments,function(i,v){
		args.push(v);
	});
	console.log.apply(console,args);
}


ace = {

	config: {
		readyCheckDelay: 15
	}
	,_readyCbs: []
	,_ready: false

	,init: function(){
		var z = this;
		if (z.inited)
			return false;
		z.inited = true;

		(function checkReady(){
			if (!window.$)
				return setTimeout(checkReady,z.config.readyCheckDelay);
			z._jQExtensions();
			console.log('ace ready');
			z._ready = true;
			$.each(z._readyCbs,function(i,cb){
				if (cb instanceof Function)
					cb();
			});
			delete z._readyCbs;
			z.ui.checkForWidgets();
		}());
	}

	,ready: function(cb){
		if (this._ready)
			cb();
		else
			this._readyCbs.push(cb);
	}

	,ui: {
		_modules: {}

		,register: function(key,proto){
			var z = this;
			if (z.getModule(key))
				return console.log(key+' already registered');
			ace.ready(function(){
				//var module = z._modules[key] = new Function;
				var module = z._modules[key] = function(){
					AceBase.call(this);
				}
				module.prototype = new AceBase;
				module.prototype.constructor = module;
				$.extend(true,module.prototype,{
					init: function(){}
					,opts: {}
				},proto,{
					key: key
					,cssKey: 'ace-'+key
				});
				module.instances = [];
				ace.bus.trigger(key+':registered');
			});
		}

		,getModule: function(key){
			return this._modules[key];
		}

		,moduleReady: function(moduleKey,cb){
			var z = this;
			ace.bus.ready(moduleKey+':registered',function(){
				ace.ready(cb);
				/* these are silly
				var module = z.getModule(moduleKey)
					,i = 0
					,deps
				;
				if (!(module.config && module.config.dependencies && module.config.dependencies instanceof Array && module.config.dependencies.length))
					return depsRdy();
				deps = module.config.dependencies;
				(function next(){
					ace.bus.ready(deps[i]+':registered',function(){
						if (++i == deps.length)
							return depsRdy();
						next();
					});
				}());
				function depsRdy(){
					ace.ready(cb);
				}
				*/
			});
		}

		,checkForWidgets: function(jCont){
			var z = this;
			$(function(){
				(jCont || $('body')).find('script[type^="text/ace-"]').each(function(){
					var $script = $(this)
						,key = $script.attr('type').replace('text/ace-','')
						,opts
					;
					try {
						opts = eval('('+$.trim($script[0].innerHTML)+')');
					} catch (e) {}
					if (typeof opts != 'object')
						opts = {};
					z.widgetize(key,$script,opts);
				});
			});
		}

		,widgetize: function(key,$cont,opts,cb){
			var z = this;
			z.moduleReady(key,function(){
				var $elm = $('<div class="ace-'+key+'"></div>')
					,module = z.getModule(key)
					,instance = new module()
				;
				$cont.replaceWith($elm);
				instance.opts = $.extend(true,{},module.prototype.opts,opts);
				instance.$ = {
					cont: $elm
				};
				module.instances.push(instance);
				instance.init();
				if (cb)
					cb.call(instance);
			});
		}

	}

	,bus: new AceBase

	,util: {
		strToClass: function(str){
			return str.replace(/(^[^a-zA-Z]+)|([^a-zA-Z0-9_\-])/g,'');
		}

		,rand: function(min,max){
			return min+Math.round(Math.random()*(max-min));
		}

		,capitalize: function(str){
			var words = str.split(' ')
				i,c
			;
			for (i=0,c=words.length;i<c;++i) {
				if (words[i])
					words[i] = words[i].charAt(0).toUpperCase() + words[i].substr(1);
			}
			return words.join(' ');
		}

		,escapeHtml: function(str,nl2br){
			str = $('<div>').text(str).html();
			if (nl2br)
				str = str.replace(/\n/g,'<br />')
			return str;
		}

		,escapeRegEx: function(str){
			// adds slashes to regex control chars
			return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
		}

		,formatPlace: function(num){
			var numPos = Math.abs(num)
				,lastChar = (num+'').split('').pop()
				,suffix
			;
			if (num == 0) return '0th';
			if (numPos > 10 && numPos < 20) suffix = 'th';
			else if (lastChar == 1) suffix = 'st';
			else if (lastChar == 2) suffix = 'nd';
			else if (lastChar == 3) suffix = 'rd';
			else suffix = 'th';
			return num+suffix;
		}

		,formatInteger: function(num){
			var pieces = (num+'').match(/^(\-?)([0-9]+)(.*)/)
				,chars,i,c
			;				
			if (!pieces || !pieces[2])
				return num;
			chars = pieces[2].split('');
			for (i=3,c=chars.length;i<c;i=i+3)
				chars[c-i-1] += ',';
			return pieces[1] + chars.join('') + (pieces[3] ? pieces[3] : '');
		}

		,formatTimeAgo: function(timestamp,now){
			if (typeof timestamp == 'string' && isNaN(timestamp))
				timestamp = new Date(timestamp);
			if (timestamp instanceof Date)
				timestamp = Math.round(+timestamp/1000);
			if (typeof now == 'string' && isNaN(now))
				now = new Date(now);
			if (now instanceof Date)
				now = +now;
			now = typeof now == 'undefined' ? Math.round(+new Date/1000) : now;
			var secs = now - timestamp
				,intervals = [
					['year',31536000]
					,['month',2628000]
					,['week',604800]
					,['day',86400]
					,['hour',3600]
					,['minute',60]
				],recent = 'just now'
				,secs,str
			;
			if (secs < 0)
				secs = 0;
			$.each(intervals,function(i,interval){
				var ago = Math.floor(secs/interval[1]);
				if (ago > 0) {
					str = ago+' '+interval[0]+(ago==1?'':'s')+' ago'
					return false;
				}
			});
			if (typeof str == 'undefined')
				str = recent;
			return str;
		}

		,getViewportScrollY: function(){
			return (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
		}

		,trueDim: function(jelm,includeMargin){
			var nre = /[^0-9\-.]/g
				,d = {
					w: jelm.width()
					,h: jelm.height()
				}
				,add,i,c
			;
			add = ['border-left-width','padding-left','padding-right','border-right-width'];
			if (includeMargin)
				add.push.apply(add,['margin-left','margin-right']);
			for (i=0,c=add.length;i<c;++i)
				d.w += +(jelm.css(add[i])||'0').replace(nre,'');
			add = ['border-top-width','padding-top','padding-bottom','border-bottom-width'];
			if (includeMargin)
				add.push.apply(add,['margin-top','margin-bottom']);
			for (i=0,c=add.length;i<c;++i)
				d.h += +(jelm.css(add[i])||'0').replace(nre,'');
			return d;
		}

		,arrayFilter: function(arr,cb,start){
			var i,c;
			start = typeof(start) == 'number' ? start : 0;
			for (i=start,c=arr.length;i<c;++i) {
				if (!cb(arr[i])) {
					arr.splice(i,1);
					this.arrayFilter(arr,cb,i);
					break;
				}
			}
			return arr;
		}

		,getImageToWindowFit: function(windowSize,imgSize,center){
			/**
				ex:
					center = [null,50/100]
					center = [0.2,0.8]
			**/
			windowSize = [+windowSize[0],+windowSize[1]];
			imgSize = [+imgSize[0],+imgSize[1]];
			if (!center) center = [null,null];
			center = [center[0] === null ? null : +center[0],center[1] === null ? null : +center[1]];

			var windowW2H = windowSize[0]/windowSize[1]
				,imgW2H = imgSize[0]/imgSize[1]
				,offsetX = 0, offsetY = 0
				,newWidth,newHeight,fit
			;

			if (windowW2H > imgW2H) {
				newWidth = windowSize[0];
				newHeight = newWidth/imgW2H;
				if (newHeight < windowSize[1]) newHeight = windowSize[1];
				offsetY = -1 * (newHeight-windowSize[1])/2;
				if (center[1] !== null) offsetY += (.5-center[1])*newHeight;
				if (offsetY > 0) offsetY = 0;
				else if (offsetY < windowSize[1]-newHeight) offsetY = windowSize[1]-newHeight;
			} else {
				newHeight = windowSize[1];
				newWidth = newHeight*imgW2H;
				if (newWidth < windowSize[0]) newWidth = windowSize[0];
				offsetX = -1*(newWidth-windowSize[0])/2;
				if (center[0] !== null) offsetX += (.5-center[0])*newWidth;
				if (offsetX > 0) offsetX = 0;
				else if (offsetX < windowSize[0]-newWidth) offsetX = windowSize[0]-newWidth;
			}

			fit = {
				width: newWidth
				,height: newHeight
				,offset: {
					x: offsetX
					,y: offsetY
				}
			};
			fit.style = 'width:'+fit.width+'px;height:'+fit.height+'px;left:'+fit.offset.x+'px;top:'+fit.offset.y+'px;';
			fit.css = {
				width: fit.width+'px'
				,height: fit.height+'px'
				,left: fit.offset.x+'px'
				,top: fit.offset.y+'px'
			};
			return fit;
		}

		,onTouchDevice: function(){
			return 'ontouchstart' in document.documentElement;
		}

	}

	,_jQExtensions: function(){
		$.fn.imagesLoaded = function(cb){
			var $elm = this
				,jimgs = this.find('img').andSelf().filter('img')
				,imgs = []
				,numLoaded = 0
				,numImgs,loaded
			;
			numImgs = jimgs.length;
			if (!numImgs)
				return done();
			loaded = function(index){
				if (!imgs[index]) {
					imgs[index] = true;
					if (++numLoaded == numImgs)
						done();
				}
			};
			jimgs.each(function(index){
				var doIt = function(){
					loaded(index);
				};
				imgs.push(false);
				if (this.complete) {
					doIt();
				} else {
					$(this).bind('load',doIt).bind('error',doIt);
					if (this.complete)
						doIt();
				}
			});
			function done(){
				if (cb) {
					setTimeout(function(){
						cb.call($elm);
					},0);
				}
			}
		}
		$.fn.widgetize = function(widgetName, opts){
			ace.ui.widgetize(widgetName, this, opts);
		}
	}

};


ace.ui.register('instagram',{
	opts: {
		clientId: 'a26e3cd4b7b24a50857f54f78f051b63'
		,url: 'https://api.instagram.com/v1/'
		,type: 'squares med'
		,num: 10
		,hoverFadeIn: true
		,shadbox: true
	}
	,init: function(){
		var z = this;
		z.getData(function(){
			z.build();
			z.functionalize();
		});
	}
	,getData: function(cb){
		var z = this;
		$.getJSON(z.opts.url+z.opts.query+'?callback=?',{
			client_id: z.opts.clientId
			,count: z.opts.num
		},function(data){
			if (!(data && data.data))
				return z.log('api error');
			z.media = data.data;
			cb();
		});
	}
	,build: function(){
		var z = this
			,x = z.cssKey
		;
		$.each(z.opts.type.split(' '),function(i,t){
			z.$.cont.addClass('type-'+t);
		});
		$.each(z.media,function(i,m){
			var jImg = $('<div class="'+x+'-img">'
				+ '<img class="'+x+'-img-img" src="'+m.images.low_resolution.url+'" xdata-img="'+m.images.standard_resolution.url+'" />'
			+ '</div>');
			jImg.find('img.'+x+'-img-img').attr('alt',m.caption.text);
			z.$.cont.append(jImg);
		});
		z.$.cont.append('<div class="clear">&nbsp;</div>');

		z.$.imgs = z.$.cont.find('div.'+x+'-img');
	}
	,functionalize: function(){
		var z = this
			,x = z.cssKey
		;

		if (z.opts.hoverFadeIn) {
			z.$.imgs.fadeTo(0,.5);
			z.$.imgs.bind('mouseover mouseout',function(e){
				var t = $(this);
				if (e.type == 'mouseover')
					t.stop().fadeTo(200,1);
				else
					t.stop().fadeTo(200,.5);
			});
		}

		if (z.opts.shadbox) {
			z.$.cont.addClass('shadbox_enabled');
			z.$.cont.find('img.'+x+'-img-img').bind('click',function(){
				ace.shadbox($(this).attr('xdata-img'));
			});
		}
	}
});


ace.ui.register('soundcloud-playlist',{
	opts: {
		clientId: '580b0997c079424f971147f110046ef7'
		,url: 'http://api.soundcloud.com/playlists/'
		,playlistId: null
		,numShow: 3
		,colors: [
			'ff5500'
			,'00a8ff'
		]
	}
	,init: function(){
		var z = this;
		z.getData(function(){
			z.build();
			//z.functionalize();
		});
	}
	,getData: function(cb){
		var z = this;
		$.getJSON(z.opts.url+z.opts.playlistId+'.json?callback=?',{
			client_id: z.opts.clientId
			,count: z.opts.num
		},function(data){
			if (!(data && data.tracks))
				return z.log('api error');
			z.data = data;
			cb();
		});
	}
	,build: function(){
		var z = this
			,x = z.cssKey
			,track,url,i
		;
		if (z.opts.type)
			$.each(z.opts.type.split(' '),function(i,t){
				z.$.cont.addClass('type-'+t);
			});
		for (i=0;i<z.data.tracks.length&&i<z.opts.numShow;++i) {
			track = z.data.tracks[i];
			color = z.opts.colors[i%z.opts.colors.length];
			url = 'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/'+track.id+'&amp;color='+color+'&amp;auto_play=false&amp;hide_related=true&amp;show_comments=false&amp;show_user=false&amp;show_reposts=false&amp;visual=false&amp;player_type=tiny';
			z.$.cont.append(
				'<object height="20" width="100%">'
					+ '<param name="movie" value="'+url+'"></param>'
					+ '<param name="allowscriptaccess" value="always"></param>'
					+ '<param name="wmode" value="transparent"></param>'
					+ '<embed wmode="transparent" allowscriptaccess="always" height="20" width="100%" src="'+url+'"></embed>'
				+ '</object>'
			);
		}
	}
});


ace.ui.register('carousel',{
	opts: {
		imgs: []
		,dims: '195x148'
		,speed: 300
		,shadbox: true
	}
	,init: function(){
		var z = this
			,d = z.opts.dims.split('x')
		;
		z.slideQueue = [];
		z.imgWidth = +d[0];
		z.imgHeight = +d[1];

		if (!z.opts.imgs.length) {
			z.$.cont.css('display','none');
			return z.log('missing imgs');
		}

		z.build();
		z.calcDims();
		z.position();
		z.functionalize();
	}
	,build: function(){
		var z = this
			,x = z.cssKey
		;
		z.$.cont.html('<div class="'+x+'-mask">'
				+ '<div class="'+x+'-slide_cont"></div>'
			+ '</div>'
			+'<div class="'+x+'-arr '+x+'-arr-left" xdata-dir="-1" style="display:none;"></div>'
			+'<div class="'+x+'-arr '+x+'-arr-right" xdata-dir="1" style="display:none;"></div>'
		);
		z.$.mask = z.$.cont.find('div.'+x+'-mask');
		z.$.slidesCont = z.$.mask.find('div.'+x+'-slide_cont');
		z.$.arrows = z.$.cont.find('div.'+x+'-arr');
		z.$.slides = z.createSlide();
		z.$.slidesCont.append(z.$.slides);
	}
	,calcDims: function(){
		var z = this
			,x = z.cssKey
			,td = ace.util.trueDim(z.$.slides.eq(0).find('div.'+x+'-img').eq(0),true)
		;
		z.itemWidth = td.w;
		z.itemHeight = td.h;
		z.slideWidth = z.opts.imgs.length*z.itemWidth;
		z.maskWidth = z.$.mask.width();
		z.slideDistance = Math.floor(z.maskWidth/z.itemWidth)*z.itemWidth;
	}
	,createSlide: function(){
		var z = this
			,x = z.cssKey
			,jSlide
		;
		if (z.$.slides && z.$.slides.length)
			return z.$.slides.eq(0).clone(true);
		jSlide = $('<div class="'+x+'-slide" style="visibility:hidden;"></div>')
		$.each(z.opts.imgs,function(i,src){
			jSlide.append('<div class="'+x+'-img is-loading" style="width:'+z.imgWidth+'px;height:'+z.imgHeight+'px;">'
				+ '<div class="'+x+'-img-wrap">'
					+ '<img class="'+x+'-img-img" alt="" src="'+src+'" style="display:none;" />'
				+ '</div>'
			+ '</div>');
		});
		return jSlide;
	}
	,position: function(){
		var z = this
			,x = z.cssKey
			,jSlide
		;
		z.$.mask.css('height',z.itemHeight+'px');

		if (z.slideWidth > z.maskWidth) {
			// need arrow functionality
			z.$.slides.eq(0).css('left',0);
			z.$.slides = z.$.slides.add(jSlide=z.createSlide().css('left',(-z.slideWidth)+'px'));
			z.$.slidesCont.append(jSlide);
			z.$.slides = z.$.slides.add(jSlide=z.createSlide().css('left',z.slideWidth+'px'));
			z.$.slidesCont.append(jSlide);
			z.$.arrows.css('display','');
		}

		z.$.slides.each(function(i){
			z.$.slides.eq(i).find('div.'+x+'-img').each(function(n){
				$(this).css('left',(n*z.itemWidth)+'px').imagesLoaded(function(){
					var jImg = $(this)
						,jImgImg = jImg.find('img.'+x+'-img-img')
					;
					jImg.removeClass('is-loading');
					jImgImg.css(
						ace.util.getImageToWindowFit([z.imgWidth,z.imgHeight],[jImgImg[0].width,jImgImg[0].height]).css
					).css('display','');
				});
			});
		});

		z.$.slides.css('visibility','');
	}
	,functionalize: function(){
		var z = this
			,x = z.cssKey
		;

		z.$.arrows.bind('click',function(){
			z.slide(+$(this).attr('xdata-dir'));
		});

		if (z.opts.shadbox) {
			z.$.cont.addClass('shadbox_enabled');
			z.$.slides.find('img.'+x+'-img-img').bind('click',function(){
				ace.shadbox($(this).attr('src'));
			});
		}
	}
	,slide: function(dir){
		var z = this;

		//z.slideQueue.push(dir);
		// if they click a direction opposite of current animation lets clear the queue
		if (z.slideQueue[0] && z.slideQueue[0] != dir)
			z.slideQueue = [z.slideQueue[0],dir]
		else
			z.slideQueue.push(dir);

		if (z.slideQueue.length == 1)
			slide();

		function slide() {
			var dir = z.slideQueue[0];
			if (!dir)
				return;
			z.$.slidesCont.animate({
				left: (z.$.slidesCont.position().left-(dir*z.slideDistance))+'px'
			},{
				duration: z.opts.speed
				,complete: function(){
					var offsetX = z.$.slidesCont.position().left;
					z.$.slides.sort(function(a,b){
						return $(a).position().left-$(b).position().left;
					});
					// this wastes resources popping back and forth unnecessarily
					//	dont have time to fix atm
					if (z.$.slides.eq(0).position().left+offsetX + z.slideWidth < -z.slideDistance) {
						// push onto end
						z.$.slides.eq(0).css('left', (z.$.slides.eq(2).position().left+z.slideWidth)+'px');
					} else if (z.$.slides.eq(2).position().left+offsetX > z.maskWidth+z.slideDistance) {
						// pop into beginning
						z.$.slides.eq(2).css('left', (z.$.slides.eq(0).position().left-z.slideWidth)+'px');
					}
					z.slideQueue.shift();
					slide();
				}
			});
		}
	}
});


ace.shadbox = function(src,opts,cb){
	var z = ace.shadbox
		,opts_ = $.extend({},typeof(opts)=='object'?opts:{},z.config.defaults)
		,cb_ = cb ? cb : (opts instanceof Function ? opts : null)
	;

	z.close();
	if (!z.$.cont)
		z.build();

	z.open(src,opts_,cb_);
};
ace.shadbox.config = {
	cssKey: 'ace-shadbox'
	,defaults: {
		viewport: {
			padding: {x:.05, y:.05}
		}
		,anim: {
			fadeSpeed: 100
			,delay: 300
			,contentExpandSpeed: 300
			,contentFadeInSpeed: 300
		}
	}
}
ace.shadbox.$ = {};
ace.shadbox.build = function(){
	var z = this
		,x = z.config.cssKey
	;
	z.$.cont = $('<div class="'+x+'" style="display:none;">'
		+ '<div class="'+x+'-bg"></div>'
		+ '<div class="'+x+'-content">'
			+ '<div class="'+x+'-content-item"></div>'
			+ '<a class="'+x+'-close" href="#"></a>'
		+ '</div>'
	+ '</div>');
	$('body').append(z.$.cont);
	z.$.bg = z.$.cont.find('div.'+x+'-bg');
	z.$.content = z.$.cont.find('div.'+x+'-content');
	z.$.contentItem = z.$.content.find('div.'+x+'-content-item');
	z.$.close = z.$.content.find('a.'+x+'-close');

	z.$.cont.bind('click',function(){
		z.close();
	});
	z.$.close.bind('click',function(e){
		e.preventDefault();
	});
}
ace.shadbox.open = function(src,opts,cb){
	var z = this
		,d = $(document)
		,w = $(window)
		,viewportWidth = w.width()
		,viewportHeight = w.height()
		,paddingX = viewportWidth*opts.viewport.padding.x
		,paddingY = viewportHeight*opts.viewport.padding.y
		,initialX = (viewportWidth-z.$.content.width())/2
		//,initialY = (viewportHeight-z.$.content.height())/2 + ace.util.getViewportScrollY()
		,initialY = (viewportHeight-z.$.content.height())/2
		,img
	;

	z.isOpening = true;
	z.$.content.addClass('loading').css({
		width: ''
		,height: ''
	});
	z.$.content.css({
		left: initialX+'px'
		,top: initialY+'px'
	});
	z.$.cont.css({
		width: d.width()+'px'
		,height: d.height()+'px'
	}).fadeIn(opts.anim.fadeSpeed);
	img = new Image;
	$(img).bind('load',function(){
		var viewWidth = viewportWidth-paddingX
			,viewHeight = viewportHeight-paddingY
			,imgRatio,viewRatio,targetWidth,targetHeight,targetX,targetY
		;
		if (img.width > viewWidth || img.height > viewHeight) {
			imgRatio = img.width/img.height;
			viewRatio = viewWidth/viewHeight;
			if (viewRatio < imgRatio) {
				targetWidth = viewWidth;
				targetHeight = targetWidth/imgRatio;
			} else {
				targetHeight = viewHeight;
				targetWidth = targetHeight*imgRatio;
			}
		} else {
			targetWidth = img.width;
			targetHeight = img.height;
		}
		targetX = (viewportWidth-targetWidth)/2;
		//targetY = (viewportHeight-targetHeight)/2 + ace.util.getViewportScrollY();
		targetY = (viewportHeight-targetHeight)/2;
		jImg = $('<img src="'+src+'" alt="" />').fadeTo(0,0);
		z.$.contentItem.append(jImg);
		z.$.content.delay(opts.anim.delay).animate({
			width: targetWidth+'px'
			,height: targetHeight+'px'
			,left: targetX+'px'
			,top: targetY+'px'
		},{
			duration: opts.anim.contentExpandSpeed
			,complete: function(){
				z.$.content.removeClass('loading');
				jImg.fadeTo(opts.anim.contentFadeInSpeed,1,function(){
					z.isOpening = false;
					z.isOpen = true;
					if (cb)
						cb();
				});
			}
		});
	}).bind('error',function(){
		z.isOpening = false;
		z.isOpen = true;
		z.$.content.removeClass('loading').addClass('error').css({
			left: (viewportWidth-z.$.content.width())/2 + 'px'
			//,top: ((viewportHeight-z.$.content.height())/2 + ace.util.getViewportScrollY()) + 'px'
			,top: ((viewportHeight-z.$.content.height())/2) + 'px'
		});
		if (cb)
			cb();
	});
	img.src = src;
}
ace.shadbox.close = function(){
	var z = this;
	z.isOpen = z.isOpening = false;
	if (z.$.cont) {
		z.$.cont.css('display','none');
		z.$.content.removeClass('error loading').css({
			width: ''
			,height: ''
			,left: ''
			,top: ''
		});
		z.$.contentItem.empty();
	}
}



ace.ui.register('twitter',{
	// http://wp.fabfitfun.com/ace/api/twitter/get?route=statuses/user_timeline&p[screen_name]=alecisawesome&p[count]=10
	opts: {
		numGet: 10
		,numShow: 1
		,scroll: 'x'
		,scrollDelay: 8000
		,scrollSpeed: 1000
		,type: ''
	}
	,init: function(){
		var z = this;
		z.tweets = [];
		z.getData(function(){
			z.build();
			z.functionalize();
		});
	}
	,getData: function(cb){
		var z = this;
		$.getJSON('/ace/api/twitter/get',{
			route: 'statuses/user_timeline'
			,p: {
				screen_name: z.opts.screenName
				,count: z.opts.numGet
			}
		},function(data){
			if (data.error)
				return z.log(data.error);
			if (!(data.data instanceof Array))
				return z.log('unexpected response');
			z.data = data.data;
			if (!z.data[0])
				return z.log('no tweets');
			cb();
		});
	}
	,build: function(){
		var z = this
			,x = z.cssKey
		;
		z.$.cont.addClass('has-num-'+z.opts.numShow);
		if (z.opts.scroll)
			z.$.cont.addClass('is-scroll-'+z.opts.scroll);
		$.each(z.opts.type.split(' '),function(i,v){
			z.$.cont.addClass('type-'+v);
		});
		z.$.cont.html('<div class="'+x+'-wrap"><div class="'+x+'-wrap2">'
			+ '<div class="'+x+'-tweets_cont"></div>'
			+ '<div class="clear">&nbsp;</div>'
		+ '</div></div>');
		z.$.tweetsCont = z.$.cont.find('div.'+x+'-tweets_cont');
		z.$.tweets = $([]);
		$.each(z.data,function(i,tweet){
			var item = {
				$: {}
			};
			item.$.cont = $('<div class="'+x+'-tweet" style="display:none;"><div class="'+x+'-tweet-wrap"><div class="'+x+'-tweet-wrap-inner">'
				+ '<div class="'+x+'-tweet-text">'+z.formatText(tweet)+'</div>'
				+ '<div class="'+x+'-tweet-time">'+ace.util.formatTimeAgo(tweet.created_at)+'</div>'
			+ '</div></div></div>');
			item.$.wrap = item.$.cont.find('div.'+x+'-tweet-wrap')
			item.$.wrapInner = item.$.cont.find('div.'+x+'-tweet-wrap-inner')
			if (i < z.opts.numShow)
				item.$.cont.css('display','');
			z.$.tweetsCont.append(item.$.cont);
			z.tweets.push(item);
		});
	}
	,functionalize: function(){
		var z = this
			,x = z.cssKey
		;
		z.setUpScroll();
	}
	,formatText: function(tweet){
		var text = tweet.text
			,match = {}
		;
		if (tweet.entities.urls)
			$.each(tweet.entities.urls,function(i,item){
				if (match[item.url])
					return true;
				match[item.url] = true;
				text = text.replace(new RegExp(ace.util.escapeRegEx(item.url),'g'),'<a href="'+item.url+'" target="_blank">'+(item.display_url||item.url)+'</a>');
			});
		if (tweet.entities.media)
			$.each(tweet.entities.media,function(i,item){
				if (match[item.url])
					return true;
				match[item.url] = true;
				text = text.replace(new RegExp(ace.util.escapeRegEx(item.url),'g'),'<a href="'+item.url+'" target="_blank">'+(item.display_url||item.url)+'</a>');
			});
		match = {};
		if (tweet.entities.hashtags)
			$.each(tweet.entities.hashtags,function(i,item){
				if (match[item.text])
					return true;
				match[item.text] = true;
				text = text.replace(new RegExp('#'+ace.util.escapeRegEx(item.text),'g'),'<a href="https://twitter.com/search?q=%23'+encodeURIComponent(item.text)+'&src=hash" target="_blank">#'+item.text+'</a>');
			});
		return text;
	}
	,setUpScroll: function(){
		var z = this;
		z.topIndex = 0;
		if (!z.opts.scroll || z.opts.numShow >= z.tweets.length)
			return;
		if (z.opts.scroll != 'x' && z.opts.scroll != 'y')
			return z.log('invalid scroll option',z.opts.scroll);
		setTimeout(scroll,z.opts.scrollDelay);
		function scroll(){
			var outgoingTweet = z.tweets[z.topIndex]
				,incomingTweet = z.tweets[(z.topIndex+z.opts.numShow)%z.tweets.length]
				,outgoingAnim,incomingAnim,autoValue
			;

			if (z.opts.scroll == 'x') {
				outgoingTweet.$.wrap.css('width',outgoingTweet.$.cont.width()+'px');
				incomingTweet.$.cont.css({display:'',width:'auto'});
				autoValue = incomingTweet.$.cont.width();
				incomingTweet.$.cont.css('width',0);
				incomingTweet.$.wrap.css('width',autoValue+'px');
				outgoingAnim = { width: 0 };
				incomingAnim = { width: autoValue+'px' };
			} else {
				outgoingTweet.$.wrap.css('height',outgoingTweet.$.cont.height()+'px');
				incomingTweet.$.cont.css({display:'',height:'auto'});
				autoValue = incomingTweet.$.cont.height();
				incomingTweet.$.cont.css('height',0);
				incomingTweet.$.wrap.css('height',autoValue+'px');
				outgoingAnim = { height: 0 };
				incomingAnim = { height: autoValue+'px' };
			}

			outgoingTweet.$.cont.animate(outgoingAnim,{
				duration: z.opts.scrollSpeed
				,complete: function(){
					z.$.tweetsCont.append(outgoingTweet.$.cont.css('display','none'));
					setTimeout(scroll,z.opts.scrollDelay);
				}
			});
			incomingTweet.$.cont.animate(incomingAnim,{
				duration: z.opts.scrollSpeed
			});

			z.topIndex = (z.topIndex+1)%z.tweets.length;
		}
	}
});


(function(){
	function Tooltip($el,opts){
		var z = this;
		z.opts = $.extend(true,{},z.config.defaults,opts);
		z.id = z.s.count++;
		z.tooltips[z.id] = z;
		z.open = false;
		z.$ = {
			target: $el
		};
		if (z.opts.group)
			z.groups[z.opts.group] ? z.groups[z.opts.group].push(z) : (z.groups[z.opts.group] = [z]);
		if (ace.util.onTouchDevice())
			return console.log(z.config.key,'disabled for touch devices');
		$el.bind('mouseover mouseout',function(e){
			if (e.type == 'mouseover') {
				z.hideAll(z);
				if (z.opts.group !== null) {
					$.each(z.groups[z.opts.group],function(k,tip){
						tip.show();
					});
				} else
					z.show();
			} else {
				if (z.opts.group !== null) {
					$.each(z.groups[z.opts.group],function(k,tip){
						tip.hide();
					});
				} else
					z.hide();
			}
		});
	};
	Tooltip.prototype.config = {
		key: 'tooltip'
		,cssKey: 'ace-tooltip'
		,defaults: {
			content: ''
			,offset: null // null = width of arrow
			,pos: 'top' // top bot left right
			,fixed: false
			,group: null // tips with the same group will show/hide at the same time
			,classes: ''
		}
	}
	Tooltip.prototype.tooltips = {};
	Tooltip.prototype.groups = {};
	Tooltip.prototype.s = {
		count: 0
	}
	Tooltip.prototype.build = function(){
		var z = this
			,x = z.config.cssKey
			,pos = z.opts.fixed ? 'fixed' : 'absolute'
		;
		if (z.built)
			return false;
		z.built = true;
		z.$.cont = $('<div class="'+x+' pos-'+z.opts.pos+' '+z.opts.classes+'" style="position:'+pos+';">'
			+ '<div class="'+x+'-content">'+z.opts.content+'</div>'
			+ '<div class="'+x+'-arrow" style="position:absolute;"></div>'
		+ '</div>');
		z.$.arrow = z.$.cont.find('div.'+x+'-arrow');
		return true;
	}
	Tooltip.prototype.show = function(){
		var z = this;
		if (z.open)
			return;
		z.open = true;
		z.build();
		z.$.cont.css('visibility','hidden');
		$('body').append(z.$.cont);
		z.position();
		z.$.cont.css('visibility','');
	}
	Tooltip.prototype.hide = function(){
		var z = this;
		if (!z.open || !z.built)
			return;
		z.open = false;
		z.$.cont.remove();
	}
	Tooltip.prototype.hideAll = function(except){
		var z = this;
		$.each(z.tooltips,function(k,tooltip){
			if (tooltip != except && !(except && except.opts.group !== null && except.opts.group == tooltip.opts.group))
				tooltip.hide();
		});
	}
	Tooltip.prototype.position = function(){
		var z = this
			,$w = $(window)
			,tipDims = ace.util.trueDim(z.$.cont)
			,arrowDims = ace.util.trueDim(z.$.arrow)
			,targetDims = ace.util.trueDim(z.$.target)
			,targetOffset = z.$.target.offset()
			,windowWidth = $w.width()
			,windowHeight = $w.height()
			,offset = z.opts.offset
			,x,y,arrowX,arrowY
		;

		if (offset === null) {
			if (z.opts.pos == 'top' || z.opts.pos == 'bot')
				offset = arrowDims.h;
			else
				offset = arrowDims.w;
		}

		if (z.opts.pos == 'top') {
			x = targetOffset.left + (targetDims.w-tipDims.w)/2;
			y = targetOffset.top - tipDims.h - offset;
		} else if (z.opts.pos == 'bot') {
			x = targetOffset.left + (targetDims.w-tipDims.w)/2;
			y = targetOffset.top + targetDims.h + offset;
		} else if (z.opts.pos == 'left') {
			x = targetOffset.left - tipDims.w - offset;
			y = targetOffset.top + (targetDims.h-tipDims.h)/2;
		} else {
			x = targetOffset.left + targetDims.w + offset;
			y = targetOffset.top + (targetDims.h-tipDims.h)/2;
		}

		if (z.opts.fixed)
			y -= ace.util.getViewportScrollY();

		// keep within window
		if (x < 0)
			x = 0;
		else if (x+tipDims.w > windowWidth)
			x = windowWidth - tipDims.w;
		if (y < 0)
			y = 0;
		else if (y+tipDims.h > windowHeight)
			y = windowHeight - tipDims.h;

		if (z.opts.pos == 'top') {
			arrowX = targetOffset.left + (targetDims.w-arrowDims.w)/2 - x;
			arrowY = tipDims.h;
		} else if (z.opts.pos == 'bot') {
			arrowX = targetOffset.left + (targetDims.w-arrowDims.w)/2 - x;
			arrowY = 0 - arrowDims.h;
		} else if (z.opts.pos == 'left') {
			arrowX = tipDims.w;
			arrowY = targetOffset.top + (targetDims.h-arrowDims.h)/2 - y;
		} else {
			arrowX = 0 - arrowDims.w;
			arrowY = targetOffset.top + (targetDims.h-arrowDims.h)/2 - y;
		}

		z.$.cont.css({
			left: x+'px'
			,top: y+'px'
		});
		z.$.arrow.css({
			left: arrowX+'px'
			,top: arrowY+'px'
		});
	}

	ace.tooltip = function($el,opts){
		return new Tooltip($el,opts);
	}
	ace.tooltip.hideAll = function(except){
		Tooltip.prototype.hideAll(except);
	}
	ace.tooltip.get = function(id){
		return Tooltip.prototype.tooltips[id] ? Tooltip.prototype.tooltips[id] : null;
	}

}());

ace.ui.register('insert',{
	opts: {
		where: {
			closest: null
			,find: null
			,prepend: false
		}
		,action: 'append' // append, prepend, replace
		,what: {
			content: null
		}
	}
	,init: function(){
		var z = this;

		z.insert();
		z.$.cont.remove();
	}
	,insert: function(){
		var z = this
			,$el,action
		;
		$el = z.opts.where.closest ? z.$.cont.closest(z.opts.where.closest) : $('body');
		if (z.opts.where.find)
			$el = $el.find(z.opts.where.find);
		switch (z.opts.action) {
			case 'append': action = 'append'; break;
			case 'prepend': action = 'prepend'; break;
			case 'replace': action = 'html'; break;
			default: return z.log('invalid action', z.opts.action);
		}
		$el.addClass(z.cssKey)[action](z.opts.what.content);
	}
});


ace.init();
