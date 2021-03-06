jQuery.noConflict();


/*==========================
 DOM Ready
 ===========================*/

jQuery(function(){
	//Utilities
	cacheSelectors();
	getQueryStrings();
	nebula.dom.html.removeClass('no-js').addClass('js'); //In case Modernizr is not being used

	//Navigation
	mmenus();
	subnavExpanders();
	nebulaPrerenderListeners();
	menuSearchReplacement();

	//Search
	singleResultDrawer();
	pageSuggestion();

	//Forms
	nebulaLiveValidator();
	cf7Functions();
	cf7LocalStorage();

	//Helpers
	addHelperClasses();
	initBootstrapFunctions();
	errorMitigation();
	nebulaEqualize();
	nebulaScrollTo();
	svgImgs();

	//Interaction
	socialSharing();
	nebulaVideoTracking();
	animationTriggers();

	visibilityChangeActions();
	nebula.dom.document.on('visibilitychange', function(){
		visibilityChangeActions();
	});

	//Prevent events from sending before the pageview
	if ( isGoogleAnalyticsReady() ){
		initEventTracking();
	}

	//Remove Sass render trigger query
	if ( get('sass') && !get('persistent') && window.history.replaceState ){
		window.history.replaceState({}, document.title, removeQueryParameter('sass', window.location.href));
	}

	jQuery('form .debuginfo').addClass('hidden').css('display', 'none').attr('aria-hidden', 'true').val(nebula.user.cid);
	jQuery('span.nebula-code').parent('p').css('margin-bottom', '0px'); //Fix for <p> tags wrapping Nebula pre spans in the WYSIWYG
}); //End Document Ready


/*==========================
 Window Load
 ===========================*/

jQuery(window).on('load', function(){
	initEventTracking();
	conditionalJSLoading();

	//Navigation
	overflowDetector();

	//Search
	wpSearchInput();
	mobileSearchPlaceholder();
	initAutocompleteSearch();
	advancedSearchTriggers();
	searchValidator();
	searchTermHighlighter();

	//Forms
	nebulaAddressAutocomplete('#address-autocomplete', 'nebulaGlobalAddressAutocomplete');

	facebookSDK();
	facebookConnect();

	nebulaBattery();
	nebulaNetworkConnection();

	lastWidth = nebula.dom.window.width(); //Prep resize detection (Is this causing a forced reflow?)

	jQuery('a, li, tr').removeClass('hover');
	nebula.dom.html.addClass('loaded');

	performanceMetrics();

	setTimeout(function(){
		emphasizeSearchTerms();
	}, 1000);
}); //End Window Load


/*==========================
 Window Resize
 ===========================*/

jQuery(window).on('resize', function(){
	debounce(function(){
		if ( typeof lastWidth !== 'undefined' && nebula.dom.window.width() != lastWidth ){ //If the width actually changed
			lastWidth = nebula.dom.window.width();

			nebulaEqualize();
			mobileSearchPlaceholder();
		}
	}, 500, 'window resize');
}); //End Window Resize


//Cache common selectors and set consistent regex patterns
function cacheSelectors(force){
	if ( typeof nebula.dom === 'undefined' || !nebula.dom || force ){
		//Selectors
		nebula.dom = {
			window: jQuery(window),
			document: jQuery(document),
			html: jQuery('html'),
			body: jQuery('body')
		};

		//Regex Patterns
		//Test with: if ( regexPattern.email.test(jQuery('input').val()) ){ ... }
		window.regexPattern = {
			email: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i, //From JS Lint: Expected ']' and instead saw '['.
			phone: /^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/, //To allow letters, you'll need to convert them to their corresponding number before matching this RegEx.
			date: {
				mdy: /^((((0[13578])|([13578])|(1[02]))[.\/-](([1-9])|([0-2][0-9])|(3[01])))|(((0[469])|([469])|(11))[.\/-](([1-9])|([0-2][0-9])|(30)))|((2|02)[.\/-](([1-9])|([0-2][0-9]))))[.\/-](\d{4}|\d{2})$/,
				ymd: /^(\d{4}|\d{2})[.\/-]((((0[13578])|([13578])|(1[02]))[.\/-](([1-9])|([0-2][0-9])|(3[01])))|(((0[469])|([469])|(11))[.\/-](([1-9])|([0-2][0-9])|(30)))|((2|02)[.\/-](([1-9])|([0-2][0-9]))))$/,
			},
			hex: /^#?([a-f0-9]{6}|[a-f0-9]{3})$/,
			ip: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
			url: /(\(?(?:(http|https|ftp):\/\/)?(?:((?:[^\W\s]|\.|-|[:]{1})+)@{1})?((?:www.)?(?:[^\W\s]|\.|-)+[\.][^\W\s]{2,4}|localhost(?=\/)|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d*))?([\/]?[^\s\?]*[\/]{1})*(?:\/?([^\s\n\?\[\]\{\}\#]*(?:(?=\.)){1}|[^\s\n\?\[\]\{\}\.\#]*)?([\.]{1}[^\s\?\#]*)?)?(?:\?{1}([^\s\n\#\[\]]*))?([\#][^\s\n]*)?\)?)/i,
		};
	}
}


/*==========================
 Detection Functions
 ===========================*/

//Page Visibility
function visibilityChangeActions(){
	if ( document.visibilityState === 'prerender' ){ //Page was prerendered
		ga('send', 'event', 'Page Visibility', 'Prerendered', 'Page loaded before tab/window was visible', {'nonInteraction': true});
		pauseAllVideos(false);
	}

	if ( document.visibilitystate === 'hidden' ){ //Page is hidden
		nebula.dom.document.trigger('nebula_page_hidden');
		nebula.dom.body.addClass('page-visibility-hidden');
		pauseAllVideos(false);
	} else { //Page is visible
		nebula.dom.document.trigger('nebula_page_visible');
		nebula.dom.body.removeClass('page-visibility-hidden');
	}
}

//Record performance timing
function performanceMetrics(){
	if ( window.performance && window.performance.timing ){
		setTimeout(function(){
			var responseEnd = Math.round(performance.timing.responseEnd-performance.timing.navigationStart); //Navigation start until server response finishes
			var domReady = Math.round(performance.timing.domContentLoadedEventStart-performance.timing.navigationStart); //Navigation start until DOM ready
			var windowLoaded = Math.round(performance.timing.loadEventStart-performance.timing.navigationStart); //Navigation start until window load

			if ( nebula.dom.html.hasClass('debug') ){
				console.log('Server Response: ' + responseEnd + 'ms');
				console.log('DOM Ready: ' + domReady + 'ms');
				console.log('Window Loaded: ' + windowLoaded + 'ms');
			}

			//Validate each timing result before using them
			if ( (responseEnd > 0 && responseEnd < 6000000) && (domReady > 0 && domReady < 6000000) && (windowLoaded > 0 && windowLoaded < 6000000) ){
				ga('set', gaCustomMetrics['serverResponseTime'], responseEnd);
				ga('set', gaCustomMetrics['domReadyTime'], domReady);
				ga('set', gaCustomMetrics['windowLoadedTime'], windowLoaded);
				ga('send', 'event', 'Performance Timing', 'track', 'Used to deliver performance metrics to Google Analytics', {'nonInteraction': true});

				//Send as User Timings as well
				ga('send', 'timing', 'Performance Timing', 'Server Response', responseEnd, 'Navigation start until server response finishes (includes PHP execution time)');
				ga('send', 'timing', 'Performance Timing', 'DOM Ready', Math.round(domReady), 'Navigation start until DOM ready');
				ga('send', 'timing', 'Performance Timing', 'Window Load', Math.round(windowLoaded), 'Navigation start until window load');

				if ( typeof performance.measure !== 'undefined' ){
					performance.measure('Server Response', 'navigationStart', 'responseEnd');
					performance.measure('DOM Ready', 'navigationStart', 'domContentLoadedEventStart');
					performance.measure('Window Load', 'navigationStart', 'loadEventStart');
					//console.debug( performance.getEntriesByType('measure') );
				}
			}
		}, 0);
	}
}

//Sub-menu viewport overflow detector
function overflowDetector(){
    jQuery('#primarynav .menu > .menu-item').on({
		'mouseenter focus': function(){
			var viewportWidth = nebula.dom.window.width();
	    	var submenuLeft = jQuery(this).offset().left;
	    	var submenuRight = submenuLeft+jQuery(this).children('.sub-menu').width();
	    	if ( submenuRight > viewportWidth ){
				jQuery(this).children('.sub-menu').css('left', 'auto').css('right', '0');
	    	} else {
				jQuery(this).children('.sub-menu').css('left', '0').css('right', 'auto');
	    	}
		},
		'mouseleave': function(){
			jQuery(this).children('.sub-menu').css('left', '-9999px').css('right', 'auto');
		}
    });

}

//Check if Google Analytics is ready
function isGoogleAnalyticsReady(){
	if ( window.GAready === true ){
		nebula.dom.html.removeClass('no-gajs');
		return true;
	}

	nebula.dom.html.addClass('no-gajs');
	return false;
}

//Detect Battery Level
function nebulaBattery(){
	nebula.user.client.device.battery = false;

	if ( 'getBattery' in navigator ){
		navigator.getBattery().then(function(battery){
			nebulaBatteryData(battery);
			jQuery(battery).on('chargingchange levelchange', function(){
				nebulaBatteryData(battery);
			});
		});
	}
}

//Prep battery info for lookup
function nebulaBatteryData(battery){
	nebula.user.client.device.battery = {
		mode: ( battery.charging )? 'Adapter' : 'Battery',
		charging: ( battery.charging )? true : false,
		chargingTime: battery.chargingTime,
		dischargingTime: battery.dischargingTime,
		level: battery.level,
		percentage: parseFloat((battery.level*100).toFixed(2)) + '%',
	};
	nv('append', {
		'battery_mode': nebula.user.client.device.battery.mode,
		'battery_percentage': nebula.user.client.device.battery.percentage,
	});
	nebula.dom.document.trigger('batteryChange');
}

//Detect Network Connection
function nebulaNetworkConnection(){
	var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || false;
	if ( connection ) {
		nebula.user.client.device.connection = {
			type: connection.type,
			metered: connection.metered,
			bandwidth: connection.bandwidth,
		}
		nv('append', {
			network_type: connection.type,
			network_metered: connection.metered,
			network_bandwidth: connection.bandwidth
		});
		if ( connection.type == 'wifi' ){
			nv('append', {'network_wifi_ip': nebula.user.ip});
		}
	}
}


/*==========================
 Social Functions
 ===========================*/

//Load the SDK asynchronously
function facebookSDK(){
	if ( jQuery('[class*="fb-"]').length || jQuery('.require-fbsdk').length ){ //Only load the Facebook SDK when needed
		(function(d, s, id){
			var js, fjs = d.getElementsByTagName(s)[0];
			if (d.getElementById(id)) return;
			js = d.createElement(s); js.id = id;
			js.async = true;
			js.src = "//connect.facebook.net/en_US/all.js#xfbml=1";
			fjs.parentNode.insertBefore(js, fjs);
		}(document, 'script', 'facebook-jssdk'));
	}
}

//Facebook Connect functions
function facebookConnect(){
	window.fbConnectFlag = false;

	if ( has(nebula, 'site.options.facebook_app_id') ){
		window.fbAsyncInit = function(){
			FB.init({
				appId: nebula.site.options.facebook_app_id,
				channelUrl: nebula.site.directory.template.uri + '/inc/channel.php',
				status: true,
				xfbml: true
			});

			nebula.dom.document.trigger('fbinit');
		};
	} else {
		jQuery('.facebook-connect').remove();
	}
}

//Convert Twitter usernames, hashtags, and URLs to links.
function tweetLinks(tweet){
	var newString = tweet.replace(/(http(\S)*)/g, '<a href="' + "$1" + '" target="_blank" rel="noopener">' + "$1" + '</a>'); //Links that begin with "http"
	newString = newString.replace(/#(([a-zA-Z0-9_])*)/g, '<a href="https://twitter.com/hashtag/' + "$1" + '" target="_blank" rel="noopener">#' + "$1" + '</a>'); //Link hashtags
	newString = newString.replace(/@(([a-zA-Z0-9_])*)/g, '<a href="https://twitter.com/' + "$1" + '" target="_blank" rel="noopener">@' + "$1" + '</a>'); //Link @username mentions
	return newString;
}

//Social sharing buttons
function socialSharing(){
    var encloc = encodeURI(window.location.href);
    var enctitle = encodeURI(document.title);

    //Facebook
    jQuery('.fbshare').attr('href', 'http://www.facebook.com/sharer.php?u=' + encloc + '&t=' + enctitle).attr({'target': '_blank', 'rel': 'noopener'}).on('click tap touch', function(){
	    ga('set', gaCustomDimensions['eventIntent'], 'Intent');
	    ga('send', 'event', 'Social', 'Share', 'Facebook');
		nv('append', {'fb_share': encloc});
    });

    //Twitter
    jQuery('.twshare').attr('href', 'https://twitter.com/intent/tweet?text=' + enctitle + '&url=' + encloc).attr({'target': '_blank', 'rel': 'noopener'}).on('click tap touch', function(){
	    ga('set', gaCustomDimensions['eventIntent'], 'Intent');
	    ga('send', 'event', 'Social', 'Share', 'Twitter');
		nv('append', {'twitter_share': encloc});
    });

    //Google+
    jQuery('.gshare').attr('href', 'https://plus.google.com/share?url=' + encloc).attr({'target': '_blank', 'rel': 'noopener'}).on('click tap touch', function(){
	    ga('set', gaCustomDimensions['eventIntent'], 'Intent');
	    ga('send', 'event', 'Social', 'Share', 'Google+');
		nv('append', {'gplus_share': encloc});
    });

	//LinkedIn
    jQuery('.lishare').attr('href', 'http://www.linkedin.com/shareArticle?mini=true&url=' + encloc + '&title=' + enctitle).attr({'target': '_blank', 'rel': 'noopener'}).on('click tap touch', function(){
	    ga('set', gaCustomDimensions['eventIntent'], 'Intent');
	    ga('send', 'event', 'Social', 'Share', 'LinkedIn');
		nv('append', {'li_share': encloc});
    });

	//Pinterest
    jQuery('.pinshare').attr('href', 'http://pinterest.com/pin/create/button/?url=' + encloc).attr({'target': '_blank', 'rel': 'noopener'}).on('click tap touch', function(){
	    ga('set', gaCustomDimensions['eventIntent'], 'Intent');
	    ga('send', 'event', 'Social', 'Share', 'Pinterest');
		nv('append', {'pin_share': encloc});
    });

	//Email
    jQuery('.emshare').attr('href', 'mailto:?subject=' + enctitle + '&body=' + encloc).attr({'target': '_blank', 'rel': 'noopener'}).on('click tap touch', function(){
	    ga('set', gaCustomDimensions['eventIntent'], 'Intent');
	    ga('send', 'event', 'Social', 'Share', 'Email');
		nv('append', {'email_share': encloc});
    });

	//Web Share API
	if ( 'share' in navigator ){
		nebula.dom.document.on('click tap touch', '.webshare', function(){
			oThis = jQuery(this);

			navigator.share({
				title: document.title,
				text: nebula.post.excerpt,
				url: window.location.href
			}).then(function(){
				ga('send', 'event', 'Social', 'Share', 'Web Share API');
				oThis.addClass('success');
			});

			return false;
		});
	} else {
		jQuery('.webshare').addClass('hidden');
	}
}


/*==========================
 Analytics Functions
 ===========================*/

//Call the event tracking functions (since it needs to happen twice).
function initEventTracking(){
	once(function(){
		cacheSelectors(); //If event tracking is initialized by the async GA callback, selectors won't be cached yet

		nvData = {
			'is_js_enabled': '1',
			'screen': window.screen.width + 'x' + window.screen.height + ' (' + window.screen.colorDepth + ' bits)',
			'cookies': ( window.navigator.cookieEnabled )? '1' : '0',
			'plugins': ''
		}

		jQuery(window.navigator.plugins).each(function(){
			nvData.plugins += this.name + ', ';
		});

		if ( typeof window.ga === 'function' ){
			window.ga(function(tracker){
				nebula.dom.document.trigger('nebula_ga_available', tracker);
				nebula.user.cid = tracker.get('clientId');

				jQuery('form .debuginfo').val(nebula.user.cid);

				nvData.ga_cid = tracker.get('clientId');
				nvData.is_ga_blocked = 0;
				nv('send', nvData);
			});
		}

		if ( !window.GAready ){
			nebula.dom.document.trigger('nebula_ga_blocked');
			nvData.is_ga_blocked = 1;
			nv('send', nvData);

			//Send Pageview
			jQuery.ajax({
				type: "POST",
				url: nebula.site.ajax.url,
				data: {
					nonce: nebula.site.ajax.nonce,
					action: 'nebula_ga_ajax',
					fields: {
						hitType: 'pageview',
						location: window.location.href,
						title: document.title,
						ua: navigator.userAgent
					},
				},
				timeout: 60000
			});

			//Handle event tracking
			function ga(command, hitType, category, action, label, value, fieldsObject){
				if ( command === 'send' && hitType === 'event' ){
					var ni = 0;
					if ( fieldsObject && fieldsObject.nonInteraction === 1 ){
						ni = 1;
					}

					jQuery.ajax({
						type: "POST",
						url: nebula.site.ajax.url,
						data: {
							nonce: nebula.site.ajax.nonce,
							action: 'nebula_ga_ajax',
							fields: {
								hitType: 'event',
								category: category,
								action: action,
								label: label,
								value: value,
								ni: ni,
								location: window.location.href,
								title: document.title,
								ua: navigator.userAgent
							},
						},
						timeout: 60000
					});

					nv('append', {'ga_blocked_event': category + ' | ' + action + ' | ' + label});
				}
			}
		}

		cacheSelectors(); //Make sure selectors are cached (since this function can be called from outside this file).
		eventTracking();
		scrollDepth();

		if ( has(nebula, 'site.ecommerce') && nebula.site.ecommerce ){
			ecommerceTracking();
		}
	}, 'nebula event tracking');
}

//Google Analytics Universal Analytics Event Trackers
function eventTracking(){
	//Btn Clicks
	nebula.dom.document.on('mousedown touch tap', "button, .btn", function(e){
		eventIntent = ( e.which >= 2 )? 'Intent' : 'Explicit';
		ga('set', gaCustomDimensions['eventIntent'], eventIntent);

		var btnText = jQuery(this).val() || jQuery(this).text();
		if ( jQuery.trim(btnText) === '' ){
			btnText = '(Unknown)';
		}

		ga('send', 'event', 'Button Click', btnText, jQuery(this).attr('href'));
	});

	//Generic Form Submissions
	//This event will be a duplicate if proper event tracking is setup on each form, but serves as a safety net.
	//It is not recommended to use this event for goal tracking unless absolutely necessary!
	nebula.dom.document.on('submit', 'form', function(){
		var formID = jQuery(this).attr('id') || 'Unknown ID';
		ga('send', 'event', 'Generic Form', 'Submit', formID);
	});

	//PDF View/Download
	nebula.dom.document.on('mousedown touch tap', "a[href$='.pdf']", function(e){
		eventIntent = ( e.which >= 2 )? 'Intent' : 'Explicit';
		ga('set', gaCustomDimensions['eventIntent'], eventIntent);
		var fileName = filePath.substr(jQuery(this).attr('href').lastIndexOf("/")+1);
		ga('send', 'event', 'Download', 'PDF', fileName);
		if ( typeof fbq === 'function' ){fbq('track', 'ViewContent', {content_name: fileName});}
		nv('append', {'pdf_view': fileName});
	});

	//Notable Downloads
	nebula.dom.document.on('mousedown touch tap', ".notable a, a.notable", function(e){
		var filePath = jQuery(this).attr('href');
		if ( filePath !== '#' ){
			eventIntent = ( e.which >= 2 )? 'Intent' : 'Explicit';
			ga('set', gaCustomMetrics['notableDownloads'], 1);
			var linkText = jQuery(this).text();
			var fileName = filePath.substr(filePath.lastIndexOf("/")+1);
			ga('send', 'event', 'Download', 'Notable', fileName);
			if ( typeof fbq === 'function' ){fbq('track', 'ViewContent', {content_name: fileName});}
			nv('append', {'notable_download': fileName});
		}
	});

	//Generic Interal Search Tracking
	nebula.dom.document.on('submit', '.search', function(){
		var searchQuery = jQuery(this).find('input[name="s"]').val();
		ga('send', 'event', 'Internal Search', 'Submit', searchQuery);
		if ( typeof fbq === 'function' ){fbq('track', 'Search', {search_string: searchQuery});}
	});

	//Use one NV for all internal searches
	nebula.dom.document.on('keyup paste', '#s, input.search', function(e){
		oThis = jQuery(this);
		debounce(function(){
			if ( jQuery.trim(oThis.val()) ){
				nv('append', {'internal_search': jQuery.trim(oThis.val())});
			}
		}, 2000);
	});

	//Keyboard Shortcut (Non-interaction because they are not taking explicit action with the webpage)
	nebula.dom.document.on('keydown', function(e){
		//Ctrl+F or Cmd+F (Find)
		if ( (e.ctrlKey || e.metaKey) && e.which === 70 ){
			ga('send', 'event', 'Find on Page', 'Ctrl+F', "User initiated their browser's find tool (with keyboard shortcut)", {'nonInteraction': true});
		}

		//Ctrl+D or Cmd+D (Bookmark)
		if ( (e.ctrlKey || e.metaKey) && e.which === 68 ){ //Ctrl+D
			history.replaceState(null, document.title, window.location.href + '?utm_source=bookmark');
			ga('send', 'event', 'Bookmark', 'Ctrl+D', "User bookmarked the page (with keyboard shortcut)", {'nonInteraction': true});
		}
	});

	//Mailto link tracking
	nebula.dom.document.on('mousedown touch tap', 'a[href^="mailto"]', function(e){
		eventIntent = ( e.which >= 2 )? 'Intent' : 'Explicit';
		ga('set', gaCustomDimensions['eventIntent'], eventIntent);
		var emailAddress = jQuery(this).attr('href').replace('mailto:', '');
		ga('set', gaCustomDimensions['contactMethod'], 'Mailto');
		ga('send', 'event', 'Contact', 'Mailto', emailAddress);
		if ( typeof fbq === 'function' ){if ( typeof fbq === 'function' ){fbq('track', 'Lead', {content_name: 'Mailto',});}}
		nv('append', {'contact_method': 'mailto', 'contacted_email': emailAddress});
	});

	//Telephone link tracking
	nebula.dom.document.on('mousedown touch tap', 'a[href^="tel"]', function(e){
		eventIntent = ( e.which >= 2 )? 'Intent' : 'Explicit';
		ga('set', gaCustomDimensions['eventIntent'], eventIntent);
		var phoneNumber = jQuery(this).attr('href').replace('tel:', '');
		ga('set', gaCustomDimensions['contactMethod'], 'Click-to-Call');
		ga('send', 'event', 'Contact', 'Click-to-Call', phoneNumber);
		if ( typeof fbq === 'function' ){if ( typeof fbq === 'function' ){fbq('track', 'Lead', {content_name: 'Click-to-Call',});}}
		nv('append', {'contact_method': 'click-to-call', 'contacted_phone': phoneNumber});
	});

	//SMS link tracking
	nebula.dom.document.on('mousedown touch tap', 'a[href^="sms"]', function(e){
		eventIntent = ( e.which >= 2 )? 'Intent' : 'Explicit';
		ga('set', gaCustomDimensions['eventIntent'], eventIntent);
		var phoneNumber = jQuery(this).attr('href').replace('sms:+', '');
		ga('set', gaCustomDimensions['contactMethod'], 'SMS');
		ga('send', 'event', 'Contact', 'SMS', phoneNumber);
		if ( typeof fbq === 'function' ){if ( typeof fbq === 'function' ){fbq('track', 'Lead', {content_name: 'SMS',});}}
		nv('append', {'contact_method': 'sms', 'contacted_sms': phoneNumber});
	});

	//Non-Linked Click Attempts
	jQuery('img').on('click tap touch', function(){
		if ( !jQuery(this).parents('a').length ){
			ga('send', 'event', 'Non-Linked Click Attempt', 'Image', jQuery(this).attr('src'));
			nv('append', {'non_linked_click': jQuery(this).attr('src')});
		}
	});

	//Word copy tracking
	var copyCount = 0;
	var copyOver = 0;
	nebula.dom.document.on('cut copy', function(){
		copyCount++;
		var words = [];
		var selection = window.getSelection() + '';
		words = selection.split(' ');
		wordsLength = words.length;

		//Track Email or Phone copies as contact intent.
		emailPhone = jQuery.trim(words.join(' '));
		if ( regexPattern.email.test(emailPhone) ){
			ga('set', gaCustomDimensions['contactMethod'], 'Mailto');
			ga('set', gaCustomDimensions['eventIntent'], 'Intent');
			ga('send', 'event', 'Contact', 'Email (Copied): ' + emailPhone);
			nv('append', {'contact_method': 'Email', 'contacted_email': emailPhone});
		} else if ( regexPattern.phone.test(emailPhone) ){
			ga('set', gaCustomDimensions['contactMethod'], 'Click-to-Call');
			ga('set', gaCustomDimensions['eventIntent'], 'Intent');
			ga('send', 'event', 'Contact', 'Phone (Copied): ' + emailPhone);
			nv('append', {'contact_method': 'Phone', 'contacted_phone': emailPhone});
		}

		if ( copyCount < 13 ){
			if ( words.length > 8 ){
				words = words.slice(0, 8).join(' ');
				ga('send', 'event', 'Copied Text', words.length + ' words', words + '... [' + wordsLength + ' words]', words.length);
				nv('append', {'copied_text': words + '... [' + wordsLength + ' words]'});
			} else {
				if ( selection === '' || selection === ' ' ){
					ga('send', 'event', 'Copied Text', '[0 words]');
					nv('append', {'copied_text': '[0 words]'});
				} else {
					ga('send', 'event', 'Copied Text', words.length + ' words', selection, words.length);
					nv('append', {'copied_text': selection});
				}
			}
		} else {
			if ( copyOver === 0 ){
				ga('send', 'event', 'Copied Text', '[Copy limit reached]');
			}
			copyOver = 1;
		}
	});

	//AJAX Errors
	nebula.dom.document.ajaxError(function(e, jqXHR, settings, thrownError){
		ga('send', 'exception', {'exDescription': 'AJAX Error (' + jqXHR.status + '): ' + thrownError + ' on ' + settings.url, 'exFatal': true});
		//nv('append', {'ajax_errors': e + ' - ' + jqXHR.status + ': ' + thrownError + ' (' + jqXHR.responseText + ') on: ' + settings.url}); //Figure out which of these is the most informative
	});

	//Window Errors
	window.onerror = function (message, file, line) {
		ga('send', 'exception', {'exDescription': message + ' at ' + line + ' of ' + file, 'exFatal': false}); //Is there a better way to detect fatal vs non-fatal errors?
	}

	//Capture Print Intent
	if ( 'matchMedia' in window ){
        window.matchMedia('print').addListener(function(media){
        	if ( media.matches ){
        		sendPrintEvent();
			}
        });
    } else {
        window.onafterprint = sendPrintEvent();
    }
    function sendPrintEvent(){
		ga('set', gaCustomDimensions['eventIntent'], 'Intent');
		ga('send', 'event', 'Print', 'Print');
		nv('append', {'print': window.location});
    }
}

//Ecommerce event tracking
//Note: These supplement the plugin Enhanced Ecommerce for WooCommerce
function ecommerceTracking(){
	//Add to Cart clicks
	nebula.dom.document.on('click tap touch', 'a.add_to_cart, .single_add_to_cart_button', function(){ //@todo "Nebula" 0: is there a trigger from WooCommerce this can listen for?
		ga('send', 'event', 'Ecommerce', 'Add to Cart', jQuery(this).attr('data-product_id'));
		if ( typeof fbq === 'function' ){fbq('track', 'AddToCart');}
		nv('append', {'ecommerce_addtocart': jQuery(this).attr('data-product_id')});
	});

	//Update cart clicks
	nebula.dom.document.on('click tap touch', '.button[name="update_cart"]', function(){
		ga('send', 'event', 'Ecommerce', 'Update Cart Button', 'Update Cart button click');
		nv('increment', 'ecommerce_updatecart');
	});

	//Product Remove buttons
	nebula.dom.document.on('click tap touch', '.product-remove a.remove', function(){
		ga('send', 'event', 'Ecommerce', 'Remove this item', jQuery(this).attr('data-product_id'));
		nv('append', {'ecommerce_removefromcart': jQuery(this).attr('data-product_id')});
	});

	//Proceed to Checkout
	nebula.dom.document.on('click tap touch', '.wc-proceed-to-checkout .checkout-button', function(){
		ga('send', 'event', 'Ecommerce', 'Proceed to Checkout Button', 'Proceed to Checkout button click');
		if ( typeof fbq === 'function' ){fbq('track', 'InitiateCheckout');}
		nv('send', {'ecommerce_checkout': 'Proceed to Checkout'});
	});

	//Checkout form timing
	nebula.dom.document.on('click tap touch focus', '#billing_first_name', function(){
		nebulaTimer('ecommerce_checkout', 'start');
		ga('send', 'event', 'Ecommerce', 'Started Checkout Form', 'Began filling out the checkout form (Billing First Name)');
		nv('send', {'ecommerce_checkout': 'Started Checkout Form'});
	});

	//Place order button
	nebula.dom.document.on('click tap touch', '#place_order', function(){
		ga('send', 'timing', 'Ecommerce', 'Checkout Form', Math.round(nebulaTimer('ecommerce_checkout', 'end')), 'Billing details start to Place Order button click');
		ga('send', 'event', 'Ecommerce', 'Place Order Button', 'Place Order button click (likely exit to payment gateway)');
		if ( typeof fbq === 'function' ){fbq('track', 'Purchase');}
		nv('send', {'ecommerce_checkout': 'Placed Order', 'is_customer': 1});
	});
}

//Detect scroll depth
function scrollDepth(){
	scrollReady = performance.now();

	nebula.dom.window.on('scroll', function(){
		once(function(){
			scrollBegin = performance.now()-scrollReady;
			ga('send', 'event', 'Scroll Depth', 'Began Scrolling', 'Initial scroll started at ' + nebula.dom.document.scrollTop() + 'px', Math.round(scrollBegin), {'nonInteraction': true}); //Event value is time until scrolling
		}, 'begin scrolling');

		debounce(function(){
			//If user has reached the bottom of the page
			if ( (nebula.dom.window.height()+nebula.dom.window.scrollTop()) >= nebula.dom.document.height() ){
				once(function(){
					scrollEnd = performance.now()-(scrollBegin+scrollReady);
					ga('send', 'event', 'Scroll Depth', 'Entire Page', '', Math.round(scrollEnd), {'nonInteraction': true}); //Event value is time to reach end
				}, 'end scrolling');
			}
		}, 100, 'scroll depth');
	});
}

function isInView(element){
	if ( typeof element === 'string' ){
		element = jQuery(element);
	}

	var elementTop = element.offset().top;
	var elementBottom = element.offset().top+element.innerHeight();

	var windowTop = nebula.dom.document.scrollTop();
	var windowBottom = nebula.dom.document.scrollTop()+nebula.dom.window.height();

	if ( !nebula.dom.body.hasClass('page-visibility-hidden') && ((elementTop >= windowTop && elementTop < windowBottom) || (elementBottom >= windowTop && elementBottom < windowBottom) || (elementTop < windowTop && elementBottom > windowBottom)) ){
		return true;
	}

	return false;
}

//Interface with the nv data
function nv(action, data, callback){
	if ( !nebula.site.options.visitors_db ){
		return false;
	}

	if ( !action || !data || typeof data == 'function' ){
		console.error('Action and Data Object are both required.');
		ga('send', 'exception', {'exDescription': 'Action and Data Object are both required in nv()', 'exFatal': false});
		return false; //Action and Data are both required.
	}

	if ( typeof callback == 'string' ){
		console.error('Data must be passed as an object.');
		ga('send', 'exception', {'exDescription': 'Data must be passed as an object in nv()', 'exFatal': false});
		return false;
	}

	if ( !Object.keys(data).length ){
		return false; //data object is empty
	}

	if ( action === 'send' ){
		action = 'nebula_vdb_ajax_update_visitor';
	}

	if ( action === 'append' ){
		action = 'nebula_vdb_ajax_append_visitor';
	}

	if ( action === 'increment' ){ //Pass data as string (not object)
		action = 'nebula_vdb_ajax_increment_visitor';
	}

	if ( action === 'get' ){
		action = 'nebula_vdb_ajax_get_visitor_data';
	}

	if ( action === 'remove' ){ //Pass data as a string to remove all data for that label, otherwise pass as an object to remove specific information.
		action = 'nebula_vdb_ajax_remove_datapoint';
	}

	jQuery.ajax({
		type: "POST",
		url: nebula.site.ajax.url,
		data: {
			nonce: nebula.site.ajax.nonce,
			action: action,
			data: data,
		},
		success: function(response){
			if ( callback ){
				callback(response);
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown){
			ga('send', 'exception', {'exDescription': 'AJAX error in nv(): ' + textStatus, 'exFatal': false});
		},
		timeout: 60000
	});
}

//Easily send form data to nv() with nv-* classes
//Add a class to the input field with the category to use. Ex: nv-first_name
//Call this function before sending a ga() event because it sets dimensions too
function nvForm(){
	if ( !nebula.site.options.visitors_db ){
		return false;
	}

	nvFormObj = {};
	jQuery('form [class*="nv-"]').each(function(){
		if ( jQuery.trim(jQuery(this).val()).length ){
			if ( jQuery(this).attr('class').indexOf('nv-notable_poi') >= 0 ){
				ga('set', gaCustomDimensions['poi'], jQuery('.notable-poi').val());
			}

			var cat = /nv-([a-z\_]+)/g.exec(jQuery(this).attr('class'));
			if ( cat ){
				var thisCat = cat[1];
				nvFormObj[thisCat] = jQuery(this).val();
			}
		}
	});

	if ( Object.keys(nvFormObj).length ){
		nv('send', nvFormObj);
	}
}

//Create/Update contact in Hubspot CRM
function hubspot(mode, type, email, properties, callback){ //@todo "Nebula" 0: Update this
	if ( !nebula.site.options.hubspot_api ){
		return false;
	}

	if ( mode === 'send' && type === 'contact' ){
		jQuery.ajax({
			type: "POST",
			url: nebula.site.ajax.url,
			data: {
				nonce: nebula.site.ajax.nonce,
				action: 'nebula_ajax_send_to_hubspot',
				properties: properties,
			},
			success: function(response){
				response = JSON.parse(response);
				if ( response ){
					nebula.user.vid = response.vid;
					nv('send', {'hubspot_vid': response.vid});
				}
				nebula.dom.document.trigger('nebula_hubspot_sent');

				if ( callback ){
					callback(response);
				}
			},
			error: function(XMLHttpRequest, textStatus, errorThrown){
				ga('send', 'exception', {'exDescription': 'AJAX error in hubspot(): ' + textStatus, 'exFatal': false});
			},
			timeout: 60000
		});
	}
}

/*==========================
 Search Functions
 ===========================*/

//Search Keywords
//container is the parent container, parent is the individual item, value is usually the input val.
function keywordSearch(container, parent, value, filteredClass){
	if ( !filteredClass ){
		var filteredClass = 'filtereditem';
	}
	jQuery(container).find("*:not(:Contains(" + value + "))").closest(parent).addClass(filteredClass);
	jQuery(container).find("*:Contains(" + value + ")").closest(parent).removeClass(filteredClass);
}

//Menu Search Replacement
function menuSearchReplacement(){
	var randomMenuSearchID = Math.floor((Math.random()*100)+1);
	jQuery('li.nebula-search').html('<form class="wp-menu-nebula-search search nebula-search" method="get" action="' + nebula.site.home_url + '/"><label class="sr-only" for="nebula-menu-search-' + randomMenuSearchID + '">Search</label><input type="search" id="nebula-menu-search-' + randomMenuSearchID + '" class="nebula-search input search" name="s" placeholder="Search" autocomplete="off" x-webkit-speech /></form>');
	jQuery('li.nebula-search input').on('focus', function(){
		jQuery(this).addClass('focus active');
	});
	jQuery('li.nebula-search input').on('blur', function(){
		if ( jQuery(this).val() === '' || jQuery.trim(jQuery(this).val()).length === 0 ){
			jQuery(this).removeClass('focus active focusError').attr('placeholder', jQuery(this).attr('placeholder'));
		} else {
			jQuery(this).removeClass('active');
		}
	});
}

//Only allow alphanumeric (and some special keys) to return true
//Use inside of a keydown function, and pass the event data.
function searchTriggerOnlyChars(e){
	//@TODO "Nebula" 0: This still allows shortcuts like "cmd+a" to return true.
	var spinnerRegex = new RegExp("^[a-zA-Z0-9]+$");
	var allowedKeys = [8, 46];
	var searchChar = String.fromCharCode(!e.charCode ? e.which : e.charCode);

	if ( spinnerRegex.test(searchChar) || allowedKeys.indexOf(e.which) > -1 ){
		return true;
	} else {
		return false;
	}
}

//Enable autocomplete search on WordPress core selectors
function initAutocompleteSearch(){
	nebula.dom.document.on('blur', '.nebula-search input', function(){
		jQuery('.nebula-search').removeClass('searching').removeClass('autocompleted');
	});

	jQuery('input#s, input.search').on('keyup paste change', function(e){
		if ( !jQuery(this).hasClass('no-autocomplete') && jQuery.trim(jQuery(this).val()).length && searchTriggerOnlyChars(e) ){
			autocompleteSearch(jQuery(this));
		}
	});
}

//Run an autocomplete search on a passes element.
function autocompleteSearch(element, types){
	if ( typeof element === 'string' ){
		element = jQuery(element);
	}

	if ( types && !jQuery.isArray(types) ){
		console.error('autocompleteSearch requires 2nd parameter to be an array.');
		ga('send', 'exception', {'exDescription': 'autocompleteSearch requires 2nd parameter to be an array', 'exFatal': false});
		return false;
	}

	nebula.dom.document.trigger('nebula_autocomplete_search_start', element);
	nebulaTimer('autocompleteSearch', 'start');
	nebulaTimer('autocompleteResponse', 'start');

	if ( jQuery.trim(element.val()).length ){
		if ( jQuery.trim(element.val()).length >= 2 ){
			//Add "searching" class for custom Nebula styled forms
			element.closest('form').addClass('searching');
			setTimeout(function(){
				element.closest('form').removeClass('searching');
			}, 10000);

			//Swap magnifying glass on Bootstrap input-group
			element.closest('.input-group').find('i.fa-search').removeClass('fa-search').addClass('fa-spin fa-spinner');
		} else {
			element.closest('form').removeClass('searching');
			element.closest('.input-group').find('i.fa-spin').removeClass('fa-spin fa-spinner').addClass('fa-search');
		}

		element.autocomplete({
			position: {
				my: "left top-2px",
				at: "left bottom",
				collision: "flip",
			},
			source: function(request, response){
				jQuery.ajax({
					dataType: 'json',
					type: "POST",
					url: nebula.site.ajax.url,
					data: {
						nonce: nebula.site.ajax.nonce,
						action: 'nebula_autocomplete_search',
						data: request,
						types: JSON.stringify(types)
					},
					success: function(data){
						nebula.dom.document.trigger('nebula_autocomplete_search_success', data);
						ga('set', gaCustomMetrics['autocompleteSearches'], 1);
						if ( data ){
							nebula.dom.document.trigger('nebula_autocomplete_search_results', data);
							nebulaPrerender(data[0].link);
							jQuery.each(data, function(index, value){
								value.label = value.label.replace(/&#038;/g, "\&");
							});
							noSearchResults = '';
						} else {
							nebula.dom.document.trigger('nebula_autocomplete_search_no_results');
							noSearchResults = ' (No Results)';
						}

						debounce(function(){
							ga('send', 'event', 'Internal Search', 'Autocomplete Search' + noSearchResults, request.term);
							if ( typeof fbq === 'function' ){fbq('track', 'Search', {search_string: request.term});}
						}, 1500, 'autocomplete success buffer');

						ga('send', 'timing', 'Autocomplete Search', 'Server Response', Math.round(nebulaTimer('autocompleteSearch', 'lap')), 'Each search until server results');
						response(data);
						element.closest('form').removeClass('searching').addClass('autocompleted');
						element.closest('.input-group').find('i.fa-spin').removeClass('fa-spin fa-spinner').addClass('fa-search');
					},
					error: function(XMLHttpRequest, textStatus, errorThrown){
						nebula.dom.document.trigger('nebula_autocomplete_search_error', request.term);
						debounce(function(){
							ga('send', 'exception', {'exDescription': 'Autocomplete AJAX error: ' + textStatus, 'exFatal': false});
							nv('append', {'ajax_error': 'Autocomplete Search'});
						}, 1500, 'autocomplete error buffer');
						element.closest('form').removeClass('searching');
						element.closest('.input-group').find('i.fa-spin').removeClass('fa-spin fa-spinner').addClass('fa-search');
					},
					timeout: 60000
				});
			},
			focus: function(event, ui){
				event.preventDefault(); //Prevent input value from changing.
			},
			select: function(event, ui){
				nebula.dom.document.trigger('nebula_autocomplete_search_selected', ui);
				ga('set', gaCustomMetrics['autocompleteSearchClicks'], 1);
				ga('send', 'event', 'Internal Search', 'Autocomplete Click', ui.item.label);
	            ga('send', 'timing', 'Autocomplete Search', 'Until Navigation', Math.round(nebulaTimer('autocompleteSearch', 'end')), 'From first initial search until navigation');
	            if ( typeof ui.item.external !== 'undefined' ){
					window.open(ui.item.link, '_blank');
	            } else {
		            window.location.href = ui.item.link;
	            }
	        },
	        open: function(){
		        element.closest('form').addClass('autocompleted');
		        var heroAutoCompleteDropdown = jQuery('.form-identifier-nebula-hero-search');
				heroAutoCompleteDropdown.css('max-width', element.outerWidth());
	        },
	        close: function(){
				element.closest('form').removeClass('autocompleted');
	        },
	        minLength: 3,
	    }).data("ui-autocomplete")._renderItem = function(ul, item){
		    thisSimilarity = ( typeof item.similarity !== 'undefined' )? item.similarity.toFixed(1) + '% Match' : '';
		    var listItem = jQuery("<li class='" + item.classes + "' title='" + thisSimilarity + "'></li>").data("item.autocomplete", item).append("<a> " + item.label.replace(/\\/g, '') + "</a>").appendTo(ul);
		    return listItem;
		};
		var thisFormIdentifier = element.closest('form').attr('id') || element.closest('form').attr('name') || element.closest('form').attr('class');
		element.autocomplete("widget").addClass("form-identifier-" + thisFormIdentifier);
    }
}

//Advanced Search
function advancedSearchTriggers(){
	var advancedSearchForm = jQuery('#advanced-search-form');
	haveAllEvents = 0;

	jQuery('a#metatoggle').on('click touch tap', function(){
		jQuery('#advanced-search-meta').toggleClass('active', function(){
			if ( jQuery('#advanced-search-meta').hasClass('active') ){
				setTimeout(function(){
					jQuery('#advanced-search-meta').addClass('finished');
				}, 500);
			} else {
				jQuery('#advanced-search-meta').removeClass('finished');
			}
		});
		return false;
	});

	jQuery('#s').keyup(function(e){
		advancedSearchPrep('Typing...');
		debounce(function(){
			if ( jQuery('#s').val() ){
				ga('send', 'event', 'Internal Search', 'Advanced Search', jQuery('#s').val());
			}
		}, 1500);
	});

	nebula.dom.document.on('change', '#advanced-search-type, #advanced-search-catstags, #advanced-search-author, #advanced-search-date-start, #advanced-search-date-end', function(){
		advancedSearchPrep();
		if ( jQuery('#advanced-search-date-start') ){
			jQuery('#date-end-con').removeClass('hidden');
		} else { //@TODO "Nebula" 0: Not working...
			jQuery('#date-end-con').val('').addClass('hidden');
		}
	});

	//jQueryUI Datepicker
	jQuery('#advanced-search-date-start').datepicker({
		dateFormat: "MM d, yy",
		altField: "#advanced-search-date-start-alt",
		altFormat: "@",
		onSelect: function(){
			advancedSearchPrep();
			if ( jQuery('#advanced-search-date-start') ){
				jQuery('#date-end-con').removeClass('hidden');
			} else {
				jQuery('#date-end-con').val('').addClass('hidden');
			}
		}
	});
	jQuery('#advanced-search-date-end').datepicker({
		dateFormat: "MM d, yy",
		altField: "#advanced-search-date-end-alt",
		altFormat: "@",
		onSelect: function(){
			advancedSearchPrep();
		}
	});

	//Reset form
	jQuery('.resetfilters').on('click tap touch', function(){
		advancedSearchForm[0].reset();
		//@TODO "Nebula" 0: Chosen.js fields need to be reset manually... or something?
		jQuery(this).removeClass('active');
		advancedSearchPrep();
		return false;
	});

	loadMoreEvents = 0;
	jQuery('#load-more-events').on('click tap touch', function(){
		if ( typeof globalEventObject === 'undefined' ){
			advancedSearchPrep(10);

			loadMoreEvents = 10;

			jQuery('html, body').animate({
				scrollTop: advancedSearchForm.offset().top-10
			}, 500);

			return false;
		}

		if ( !jQuery(this).hasClass('all-events-loaded') ){
			loadMoreEvents = loadMoreEvents+10;
			advancedSearch(loadMoreEvents);

			jQuery('html, body').animate({
				scrollTop: advancedSearchForm.offset().top-10
			}, 500);
		}

		return false;
	});

	//Load Prev Events
	//@TODO "Nebula" 0: there is a bug here... i think?
	jQuery('#load-prev-events').on('click tap touch', function(){
		if ( !jQuery(this).hasClass('no-prev-events') ){
			jQuery('html, body').animate({
				scrollTop: advancedSearchForm.offset().top-10
			}, 500);

			loadMoreEvents = loadMoreEvents-10;
			advancedSearch(loadMoreEvents);
		}

		return false;
	});
}

//Either AJAX for all posts, or search immediately (if in memory)
function advancedSearchPrep(startingAt, waitingText){
	var advancedSearchIndicator = jQuery('#advanced-search-indicator');
	if ( !startingAt || typeof startingAt === 'string' ){
		waitingText = startingAt;
		startingAt = 0;
	}
	if ( haveAllEvents === 0 ){
		if ( !waitingText ){
			waitingText = 'Waiting for filters...';
		}
		advancedSearchIndicator.html('<i class="fa fa-fw fa-keyboard-o"></i> ' + waitingText);
		debounce(function(){
			advancedSearchIndicator.html('<i class="fa fa-fw fa-spin fa-spinner"></i> Loading posts...');
			jQuery.ajax({
				type: "POST",
				url: nebula.site.ajax.url,
				data: {
					nonce: nebula.site.ajax.nonce,
					action: 'nebula_advanced_search',
				},
				success: function(response){
					haveAllEvents = 1;
					advancedSearch(startingAt, response);
				},
				error: function(XMLHttpRequest, textStatus, errorThrown){
					jQuery('#advanced-search-results').text('Error: ' + XMLHttpRequest + ', ' + textStatus + ', ' + errorThrown);
					haveAllEvents = 0;
					ga('send', 'exception', {'exDescription': 'Advanced Search AJAX error: ' + textStatus, 'exFatal': false});
					nv('append', {'ajax_errors': 'Advanced Search'});
				},
				timeout: 60000
			});
		}, 1500, 'ajax search debounce');
	} else {
		advancedSearch(startingAt);
	}
}

function advancedSearch(start, eventObject){
	var advancedSearchIndicator = jQuery('#advanced-search-indicator');

	if ( eventObject ){
		globalEventObject = jQuery.parseJSON(eventObject);
	}

	//Search events object
	filteredPostsObject = postSearch(globalEventObject);

	jQuery('#advanced-search-results').html('');
	i = ( start )? parseFloat(start) : 0;
	if ( start !== 0 ){
		jQuery('#load-prev-events').removeClass('no-prev-events');
	} else {
		jQuery('#load-prev-events').addClass('no-prev-events');
	}
	if ( start+10 >= filteredPostsObject.length ){
		var end = filteredPostsObject.length;
		moreEvents(0);
	} else {
		var end = start+10;
		moreEvents(1);
	}

	if ( filteredPostsObject.length > 0 ){
		advancedSearchIndicator.html('<i class="fa fa-fw fa-calendar"></i> Showing <strong>' + (start+1) + '-' + end + '</strong> of <strong>' + filteredPostsObject.length + '</strong> results:');
	} else {
		advancedSearchIndicator.html('<i class="fa fa-fw fa-times-circle"></i> <strong>No pages found</strong> that match your filters.');
		if ( jQuery('#s').val() ){
			ga('send', 'event', 'Internal Search', 'Advanced No Results', jQuery('#s').val());
		}
		moreEvents(0);
		return false;
	}

	while ( i <= end-1 ){
		if ( !filteredPostsObject[i] || typeof filteredPostsObject[i].posted === 'undefined' ){
			moreEvents(0);
			return;
		}

		//Date and Time
		var postDate = new Date(filteredPostsObject[i].posted * 1000);
		var year = postDate.getFullYear();
		var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
		var month = months[postDate.getMonth()];
		var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		var weekday = weekdays[postDate.getDay()];
		var day = postDate.getDate();
		var hour = postDate.getHours();
		var ampm = ( hour >= 12 )? 'pm' : 'am';
		if ( hour > 12 ){
			hour -= 12;
		} else if ( hour === 0 ){
			hour = 12;
		}
		var minute = (( postDate.getMinutes() <= 9 )? '0' : '') + postDate.getMinutes();

		//Categories
		var postCats = '';
		if ( filteredPostsObject[i].categories.length ){
			eventCats = '<span class="post-cats"><i class="fa fa-fw fa-bookmark"></i> ' + filteredPostsObject[i].categories.join(', ') + '</span>';
		}

		//Tags
		var postTags = '';
		if ( filteredPostsObject[i].tags.length ){
			eventTags = '<span class="post-tags"><i class="fa fa-fw fa-tags"></i> ' + filteredPostsObject[i].tags.join(', ') + '</span>';
		}

		//Description
		var shortDescription = '';
		if ( filteredPostsObject[i].description ){
			shortDescription = ( filteredPostsObject[i].description.length > 200 )? filteredPostsObject[i].description.substring(0, 200) + '...' : filteredPostsObject[i].description;
		}

		var markUp = '<div class="advanced-search-result">' +
				'<h3><a href="' + filteredPostsObject[i].url + '">' + filteredPostsObject[i].title + '</a></h3>' +
				'<p class="post-date-time">' + month + ' ' + day + ', ' + year +
				'<p class="post-meta-tags">' + postCats + postTags + '</p>' +
				'<p class="post-meta-description">' + shortDescription + '</p>' +
				'<div class="hidden" style="display: none; visibility: hidden; pointer-events: none;">' + filteredPostsObject[i].custom.nebula_internal_search_keywords + '</div>' +
			'</div>';
		jQuery('#advanced-search-results').append(markUp);
		i++;
	}
}

function postSearch(posts){
	var tempFilteringObject = JSON.parse(JSON.stringify(posts)); //Duplicate the object in memory
	jQuery(tempFilteringObject).each(function(i){
		var thisPost = this;

		//Search Dates
		if ( jQuery.trim(jQuery('#advanced-search-date-start-alt').val()).length ){
			var postDate = new Date(thisPost.posted*1000);
			var postDateStamp = postDate.getFullYear() + '-' + postDate.getMonth() + '-' + postDate.getDate();
			var searchDateStart = new Date(parseInt(jQuery('#advanced-search-date-start-alt').val()));
			var searchDateStartStamp = searchDateStart.getFullYear() + '-' + searchDateStart.getMonth() + '-' + searchDateStart.getDate();

			if ( jQuery.trim(jQuery('#advanced-search-date-end-alt').val()).length ){
				var searchDateEnd = new Date(parseInt(jQuery('#advanced-search-date-end-alt').val()));
				if ( postDate < searchDateStart || postDate > searchDateEnd ){
					delete tempFilteringObject[i]; //Date is not in the range
					return;
				}
			} else {
				if ( postDateStamp !== searchDateStartStamp ){
					delete tempFilteringObject[i]; //Date does not match exactly
					return;
				}
			}
		}

		//Search Categories and Tags
		if ( jQuery.trim(jQuery('#advanced-search-catstags').val()).length ){
			if ( thisPost.categories || thisPost.tags ){
				jQuery.each(jQuery('#advanced-search-catstags').val(), function(key, value){
					thisCatTag = value.split('__');
					if ( thisCatTag[0] === 'category' ){
						var categoryText = thisPost.categories.join(', ').toLowerCase().replace(/&amp;/g, '&');
						if ( categoryText.indexOf(thisCatTag[1].toLowerCase()) < 0 ){
							delete tempFilteringObject[i]; //Category does not match
						}
					} else {
						var tagText = thisPost.tags.join(', ').toLowerCase().replace(/&amp;/g, '&');
						if ( tagText.indexOf(thisCatTag[1].toLowerCase()) < 0 ){
							delete tempFilteringObject[i]; //Tag does not match
						}
					}
				});
			} else {
				delete tempFilteringObject[i]; //Post does not have categories or tags
				return;
			}
		}

		//Search Post Types (This is an inclusive filter)
		if ( jQuery.trim(jQuery('#advanced-search-type').val()).length ){
			var requestedPostType = jQuery('#advanced-search-type').val().join(', ').toLowerCase();
			if ( requestedPostType.indexOf(thisPost.type.toLowerCase()) < 0 ){
				delete tempFilteringObject[i]; //Post Type does not match
			}
		}

		//Search Author
		if ( jQuery.trim(jQuery('#advanced-search-author').val()).length ){
			if ( thisPost.author.id !== jQuery('#advanced-search-author').val() ){
				delete tempFilteringObject[i]; //Author ID does not match
				return;
			}
		}

		//Keyword Filter
		if ( jQuery.trim(jQuery('#s').val()).length ){
			thisEventString = JSON.stringify(thisPost).toLowerCase();
			thisEventString += '';
			if ( thisEventString.indexOf(jQuery('#s').val().toLowerCase()) < 0 ){
				delete tempFilteringObject[i]; //Keyword not found
				return;
			}
		}
	});

	tempFilteringObject = tempFilteringObject.filter(function(){return true;});
	eventFormNeedReset();
	return tempFilteringObject;
}

function wpSearchInput(){
	jQuery('#post-0 #s, #nebula-drawer #s, .search-results #s').focus(); //Automatically focus on specific search inputs

	//Set search value as placeholder
	var searchVal = get('s') || jQuery('#s').val();
	if ( searchVal ){
		jQuery('#s').attr('placeholder', searchVal);
		jQuery('.nebula-search input').attr('placeholder', searchVal);
	}
}


//Mobile search placeholder toggle
function mobileSearchPlaceholder(){
	var mobileHeaderSearchInput = jQuery('#mobileheadersearch input');
	var searchPlaceholder = 'What are you looking for?';
	if ( window.matchMedia && window.matchMedia("(max-width: 410px)").matches ){
		searchPlaceholder = 'Search';
	}
	mobileHeaderSearchInput.attr('placeholder', searchPlaceholder);
}


//Search Validator
function searchValidator(){
	jQuery('.input.search').each(function(){
		if ( jQuery(this).val() === '' || jQuery.trim(jQuery(this).val()).length === 0 ){
			jQuery(this).parent().children('.btn.submit').addClass('disallowed');
		} else {
			jQuery(this).parent().children('.btn.submit').removeClass('disallowed').val('Search');
			jQuery(this).parent().find('.input.search').removeClass('focusError');
		}
	});
	jQuery('.input.search').on('focus blur change keyup paste cut',function(e){
		thisPlaceholder = ( jQuery(this).attr('data-prev-placeholder') !== 'undefined' )? jQuery(this).attr('data-prev-placeholder') : 'Search';
		if ( jQuery(this).val() === '' || jQuery.trim(jQuery(this).val()).length === 0 ){
			jQuery(this).parent().children('.btn.submit').addClass('disallowed');
			jQuery(this).parent().find('.btn.submit').val('Go');
		} else {
			jQuery(this).parent().children('.btn.submit').removeClass('disallowed');
			jQuery(this).parent().find('.input.search').removeClass('focusError').prop('title', '').attr('placeholder', thisPlaceholder);
			jQuery(this).parent().find('.btn.submit').prop('title', '').removeClass('notallowed').val('Search');
		}
		if ( e.type === 'paste' ){
			jQuery(this).parent().children('.btn.submit').removeClass('disallowed');
			jQuery(this).parent().find('.input.search').prop('title', '').attr('placeholder', 'Search').removeClass('focusError');
			jQuery(this).parent().find('.btn.submit').prop('title', '').removeClass('notallowed').val('Search');
		}
	})
	jQuery('form.search').submit(function(){
		if ( jQuery(this).find('.input.search').val() === '' || jQuery.trim(jQuery(this).find('.input.search').val()).length === 0 ){
			jQuery(this).parent().find('.input.search').prop('title', 'Enter a valid search term.').attr('data-prev-placeholder', jQuery(this).attr('placeholder')).attr('placeholder', 'Enter a valid search term').addClass('focusError').focus().attr('value', '');
			jQuery(this).parent().find('.btn.submit').prop('title', 'Enter a valid search term.').addClass('notallowed');
			return false;
		} else {
			return true;
		}
	});
}

//Highlight search terms
function searchTermHighlighter(){
	var theSearchTerm = document.URL.split('?s=')[1];
	if ( typeof theSearchTerm !== 'undefined' ){
		var reg = new RegExp("(?![^<]+>)(" + preg_quote(theSearchTerm.replace(/(\+|%22|%20)/g, ' ')) + ")", "ig");
		jQuery('article .entry-title a, article .entry-summary').each(function(i){
			jQuery(this).html(function(i, html){
				return html.replace(reg, '<mark class="searchresultword">$1</mark>');
			});
		});
	}
}

//Emphasize the search Terms
function emphasizeSearchTerms(){
	var theSearchTerm = get('s');
	if ( typeof theSearchTerm !== 'undefined' ){
		var origBGColor = jQuery('.searchresultword').css('background-color');
		jQuery('.searchresultword').each(function(i){
	    	var stallFor = 150 * parseInt(i);
			jQuery(this).delay(stallFor).animate({
			    backgroundColor: 'rgba(255, 255, 0, 0.5)',
			    borderColor: 'rgba(255, 255, 0, 1)',
			}, 500, 'swing', function(){
			    jQuery(this).delay(1000).animate({
				    backgroundColor: origBGColor,
				}, 1000, 'swing', function(){
				    jQuery(this).addClass('transitionable');
				});
			});
		});
	}
}

//Single search result redirection drawer
function singleResultDrawer(){
	var theSearchTerm = get('rs');
	if ( typeof theSearchTerm !== 'undefined' ){
		theSearchTerm = theSearchTerm.replace(/\%20|\+/g, ' ').replace(/\%22|"|'/g, '');
		jQuery('#searchform input#s').val(theSearchTerm);
	}

	nebula.dom.document.on('click touch tap', '#nebula-drawer .close', function(){
		var permalink = jQuery(this).attr('href');
		history.replaceState(null, document.title, permalink);
		jQuery('#nebula-drawer').slideUp();
		return false;
	});
}

//Page Suggestions for 404 or no search results pages using Google Custom Search Engine
function pageSuggestion(){
	if ( nebula.dom.body.hasClass('search-no-results') || nebula.dom.body.hasClass('error404') ){
		if ( has(nebula, 'site.options') && nebula.site.options.nebula_cse_id !== '' && nebula.site.options.nebula_google_browser_api_key !== '' ){
			if ( get().length ){
				var queryStrings = get();
			} else {
				var queryStrings = [''];
			}
			var path = window.location.pathname;
			var phrase = decodeURIComponent(jQuery.trim(path.replace(/\/+/g, ' '))) + ' ' + decodeURIComponent(jQuery.trim(queryStrings[0].replace(/\+/g, ' ')));
			tryGCSESearch(phrase);
		}
	}

	nebula.dom.document.on('mousedown touch tap', 'a.gcse-suggestion, a.internal-suggestion', function(e){
		eventIntent = ( e.which >= 2 )? 'Intent' : 'Explicit';
		ga('set', gaCustomDimensions['eventIntent'], eventIntent);

		if ( jQuery(this).hasClass('internal-suggestion') ){
			var suggestionType = 'Internal';
		} else {
			var suggestionType = 'GCSE';
		}

		ga('send', 'event', 'Page Suggestion', suggestionType, jQuery(this).text());
		nv('append', {'page_suggestion_clicks': jQuery(this).text() + ' (' + suggestionType + ')'});
	});
}

function tryGCSESearch(phrase){
	if ( nebula.site.options.nebula_cse_id.length && nebula.site.options.nebula_google_browser_api_key.length ){
		var queryParams = {
			cx: nebula.site.options.nebula_cse_id,
			key: nebula.site.options.nebula_google_browser_api_key,
			num: 10,
			q: phrase,
			alt: 'JSON'
		}
		var API_URL = 'https://www.googleapis.com/customsearch/v1?';

		// Send the request to the custom search API
		jQuery.getJSON(API_URL, queryParams, function(response){
			if ( response.items && response.items.length ){
				if ( response.items[0].link !== window.location.href ){
					showSuggestedGCSEPage(response.items[0].title, response.items[0].link);
				}
			}
		});
	}
}

function showSuggestedGCSEPage(title, url){
	var hostname = new RegExp(location.host);
	if ( hostname.test(url) ){
		jQuery('.gcse-suggestion').attr('href', url).text(title);
		jQuery('#nebula-drawer.suggestedpage').slideDown();
		nebulaPrerender(url);
	}
}

//Detections for events specific to predicting the next pageview.
function nebulaPrerenderListeners(){
	//Any post listing page
	if ( jQuery('.first-post').length ){
		nebulaPrerender(jQuery('.first-post').find('.entry-title a').attr('href'));
	}

	//Internal link hovers
	jQuery('a').on({
		'mouseenter focus': function(){
			var oThis = jQuery(this);
			if ( oThis.attr('href') !== jQuery('link#prerender').attr('href') && oThis.attr('target') !== '_blank' ){
				var hoverLength = 500;
				if ( jQuery('link#prerender').length ){ //If prerender already exists, extend the hover time needed to update
					hoverLength = 1000;
				}

				hoverTimer = setTimeout(function(){
					if ( oThis.is(":hover") ){
						nebulaPrerender(oThis.attr('href'));
					}
				}, hoverLength);
			}
		},
		'mouseleave': function(){
			if ( typeof hoverTimer !== 'undefined' ){
				clearTimeout(hoverTimer);
			}
		}
    });
}

//Actually prerender a URL
function nebulaPrerender(url){
	if ( url ){
		if ( jQuery('link#prerender').length ){
			jQuery('link#prerender').attr('href', url); //Update prerender link
		} else {
			jQuery('head').append('<link id="prerender" rel="prerender" href="' + url + ' />'); //Create new prerender link
		}
	}
}

/*==========================
 Contact Form Functions
 ===========================*/

function cf7Functions(){
	if ( !jQuery('.wpcf7-form').length ){
		return false;
	}

	formStarted = {};

	//Replace submit input with a button so a spinner icon can be used instead of the CF7 spin gif (unless it has the class "no-button")
	jQuery('.wpcf7-form input[type=submit]').each(function(){
		if ( !jQuery(this).hasClass('no-button') ){
			jQuery('.wpcf7-form input[type=submit]').replaceWith('<button id="submit" type="submit" class="' + jQuery('.wpcf7-form input[type=submit]').attr('class') + '">' + jQuery('.wpcf7-form input[type=submit]').val() + '</button>');
		}
	});

	//Track CF7 forms when they scroll into view (Autotrack). Currently not possible to change category/action/label for just these impressions.
	jQuery('.wpcf7-form').each(function(){
		ga('impressionTracker:observeElements', [{
			'id': jQuery(this).closest('.wpcf7').attr('id') || jQuery(this).attr('id'),
			'threshold': 0.25
		}]);
	});

	//For starts and field focuses
	nebula.dom.document.on('focus', '.wpcf7-form input, .wpcf7-form button, .wpcf7-form textarea', function(e){
		formID = jQuery(this).closest('div.wpcf7').attr('id');
		thisField = e.target.name || jQuery(this).closest('.form-group').find('label').text() || e.target.id || 'Unknown';

		if ( !jQuery(this).hasClass('.ignore-form') && !jQuery(this).find('.ignore-form').length && !jQuery(this).parents('.ignore-form').length ){
			//Form starts
			if ( typeof formStarted[formID] === 'undefined' || !formStarted[formID] ){
				ga('set', gaCustomMetrics['formStarts'], 1);
				ga('send', 'event', 'CF7 Form', 'Started Form (Focus)', 'Began filling out form ID: ' + formID + ' (' + thisField + ')');
				nv('increment', 'contact_funnel_started');
				formStarted[formID] = true;
			}

			updateFormFlow(formID, thisField);

			//Track individual fields
			if ( !jQuery(this).is('button') ){
				ga('send', 'event', 'CF7 Form', 'Field Focus', 'Focus into ' + thisField + '(For ID: ' + formID + ')');
			}
		}

		nebulaTimer(formID, 'start', thisField);
		nv('append', {'abandoned_form': formID}); //Temporarily prep this value and remove on successful submission

		//Individual form field timings
		if ( typeof nebulaTimings[formID] !== 'undefined' && typeof nebulaTimings[formID].lap[nebulaTimings[formID].laps-1] !== 'undefined' ){
			var labelText = '';
			if ( jQuery(this).parent('.label') ){
				labelText = jQuery(this).parent('.label').text();
			} else if ( jQuery('label[for="' + jQuery(this).attr('id') + '"]').length ){
				labelText = jQuery('label[for="' + jQuery(this).attr('id') + '"]').text();
			} else if ( jQuery(this).attr('placeholder').length ){
				labelText = ' "' + jQuery(this).attr('placeholder') + '"';
			}
			ga('send', 'timing', 'CF7 Form', nebulaTimings[formID].lap[nebulaTimings[formID].laps-1].name + labelText + ' (Form ID: ' + formID + ')', Math.round(nebulaTimings[formID].lap[nebulaTimings[formID].laps-1].duration), 'Amount of time on this input field (until next focus or submit).');
		}
	});

	nebula.dom.document.on('submit', 'form.wpcf7-form', function(){
		jQuery(this).find('button#submit').addClass('active');

		if ( !jQuery.trim(jQuery('form .debuginfo').val()).length ){
			jQuery('form .debuginfo').val(nebula.user.cid);
		}
	});

	//CF7 Invalid (CF7 AJAX response after invalid form)
	nebula.dom.document.on('wpcf7invalid', function(e){
		var formTime = nebulaTimer(e.detail.id, 'lap', 'wpcf7-submit-spam');
		updateFormFlow(formID, '[Invalid]');
		ga('set', gaCustomDimensions['contactMethod'], 'CF7 Form (Invalid)');
		ga('set', gaCustomDimensions['formTiming'], millisecondsToString(formTime) + 'ms (' + nebulaTimings[e.detail.id].laps + ' inputs)');
		ga('send', 'event', 'CF7 Form', 'Submit (Invalid)', 'Form validation errors occurred on form ID: ' + e.detail.contactFormId);
		ga('send', 'exception', {'exDescription': 'Invalid form submission for form ID ' + e.detail.contactFormID, 'exFatal': false});
		nebulaScrollTo(jQuery(".wpcf7-not-valid").first()); //Scroll to the first invalid input
		nv('increment', 'contact_funnel_submit_invalid');
		nv('append', {'form_submission_error': 'Validation (' + e.detail.contactFormId + ')'});
	});

	//General HTML5 validation errors
	jQuery('.wpcf7-form input').on('invalid', function(){ //Would it be more useful to capture all inputs (rather than just CF7)? How would we categorize this in GA?
		debounce(function(){
			updateFormFlow(formID, '[Submit]', 'HTML5 Validation Error');
			ga('send', 'event', 'CF7 Form', 'Submit (Invalid)', 'General HTML5 validation error');
		}, 50, 'invalid form');
	});

	//CF7 Spam (CF7 AJAX response after spam detection)
	nebula.dom.document.on('wpcf7spam', function(e){
		var formTime = nebulaTimer(e.detail.id, 'end');
		updateFormFlow(formID, '[Spam]');
		ga('set', gaCustomDimensions['contactMethod'], 'CF7 Form (Spam)');
		ga('set', gaCustomDimensions['formTiming'], millisecondsToString(formTime) + 'ms (' + nebulaTimings[e.detail.id].laps + ' inputs)');
		ga('send', 'event', 'CF7 Form', 'Submit (Spam)', 'Form submission failed spam tests on form ID: ' + e.detail.contactFormId);
		ga('send', 'exception', {'exDescription': 'Spam form submission for form ID ' + e.detail.contactFormID, 'exFatal': false});
		nv('increment', 'contact_funnel_submit_spam');
		nv('append', {'form_submission_error': 'Spam (' + e.detail.contactFormId + ')'});
	});

	//CF7 Mail Send Failure (CF7 AJAX response after mail failure)
	nebula.dom.document.on('wpcf7mailfailed', function(e){
		var formTime = nebulaTimer(e.detail.id, 'end');
		updateFormFlow(formID, '[Failed]');
		ga('set', gaCustomDimensions['contactMethod'], 'CF7 Form (Failed)');
		ga('set', gaCustomDimensions['formTiming'], millisecondsToString(formTime) + 'ms (' + nebulaTimings[e.detail.id].laps + ' inputs)');
		ga('send', 'event', 'CF7 Form', 'Submit (Failed)', 'Form submission email send failed for form ID: ' + e.detail.contactFormId);
		ga('send', 'exception', {'exDescription': 'Mail failed to send for form ID ' + e.detail.contactFormID, 'exFatal': true});
		nv('increment', 'contact_funnel_submit_failed');
		nv('append', {'form_submission_error': 'Failed (' + e.detail.contactFormId + ')'});
	});

	//CF7 Mail Sent Success (CF7 AJAX response after submit success)
	nebula.dom.document.on('wpcf7mailsent', function(e){
		formStarted[e.detail.id] = false; //Reset abandonment tracker for this form.

		var formTime = nebulaTimer(e.detail.id, 'end');
		updateFormFlow(formID, '[Success]');
		if ( !jQuery('#' + e.detail.id).hasClass('.ignore-form') && !jQuery('#' + e.detail.id).find('.ignore-form').length && !jQuery('#' + e.detail.id).parents('.ignore-form').length ){
			ga('set', gaCustomMetrics['formSubmissions'], 1);
		}
		ga('set', gaCustomDimensions['contactMethod'], 'CF7 Form (Success)');
		ga('set', gaCustomDimensions['formTiming'], millisecondsToString(formTime) + 'ms (' + nebulaTimings[e.detail.id].laps + ' inputs)');
		ga('send', 'timing', 'CF7 Form', 'Form Completion (ID: ' + e.detail.contactFormId + ')', Math.round(formTime), 'Initial form focus until valid submit');
		ga('send', 'event', 'CF7 Form', 'Submit (Success)', 'Form ID: ' + e.detail.contactFormId);
		if ( typeof fbq === 'function' ){fbq('track', 'Lead', {content_name: 'Form Submit (Success)'});}
		nv('increment', 'contact_funnel_submit_success');
		nv('append', {'form_submission_success': e.detail.contactFormId});
		nv('remove', {'abandoned_form': e.detail.contactFormId});

		//Clear localstorage on submit success
		jQuery('#' + e.detail.id + ' .wpcf7-textarea, #' + e.detail.id + ' .wpcf7-text').each(function(){
			localStorage.removeItem('cf7_' + jQuery(this).attr('name'));
		});

		setTimeout(function(){
			jQuery('form .debuginfo').val(nebula.user.cid); //Re-prep form for another submission
		}, 1);
	});

	//CF7 Submit (CF7 AJAX response after any submit attempt). This triggers after the other submit triggers.
	nebula.dom.document.on('wpcf7submit', function(e){
		var formTime = nebulaTimer(e.detail.id, 'lap', 'wpcf7-submit-attempt');
		nvForm(); //nvForm() here because it triggers after all others. No nv() here so it doesn't overwrite the other (more valuable) data.
		ga('set', gaCustomDimensions['contactMethod'], 'CF7 Form (Attempt)');
		ga('set', gaCustomDimensions['formTiming'], millisecondsToString(formTime) + 'ms (' + nebulaTimings[e.detail.id].laps + ' inputs)');
		ga('send', 'event', 'CF7 Form', 'Submit (Attempt)', 'Submission attempt for form ID: ' + e.detail.contactFormId); //This event is required for the notable form metric!
		if ( typeof fbq === 'function' ){fbq('track', 'Lead', {content_name: 'Form Submit (Attempt)',});}

		jQuery('#' + e.detail.id).find('button#submit').removeClass('active');
	});
}

function updateFormFlow(formID, field, info){
	if ( typeof formFlow === 'undefined' ){
		formFlow = {};
	}

	if ( !info ){
		info = '';
	} else {
		info = ' (' + info + ')';
	}

	if ( !formFlow[formID] ){
		formFlow[formID] = field + info;
	} else {
		formFlow[formID] += ' > ' + field + info;
	}

	ga('set', gaCustomDimensions['formFlow'], formFlow[formID]); //Update form field history. scope: session
}

//Enable localstorage on CF7 text inputs and textareas
function cf7LocalStorage(){
	if ( !jQuery('.wpcf7-form').length ){
		return false;
	}

	jQuery('.wpcf7-textarea, .wpcf7-text').each(function(){
		var thisLocalStorageVal = localStorage.getItem('cf7_' + jQuery(this).attr('name'));

		//Fill textareas with localstorage data on load
		if ( !jQuery(this).hasClass('no-storage') && !jQuery(this).hasClass('.wpcf7-captchar') && thisLocalStorageVal && thisLocalStorageVal !== 'undefined' && thisLocalStorageVal !== '' ){
			if ( jQuery(this).val() === '' ){ //Don't overwrite a field that already has text in it!
				jQuery(this).val(thisLocalStorageVal);
			}
			jQuery(this).blur();
		} else {
			localStorage.removeItem('cf7_' + jQuery(this).attr('name')); //Remove localstorage if it is undefined or inelligible
		}

		//Update localstorage data
		jQuery(this).on('keyup blur', function(){
			if ( !jQuery(this).hasClass('no-storage') && !jQuery(this).hasClass('.wpcf7-captchar') ){
				localStorage.setItem('cf7_' + jQuery(this).attr('name'), jQuery(this).val());
			}
		});
	});

	//Update matching form fields on other windows/tabs
	nebula.dom.window.on('storage', function(e){
    	jQuery('.wpcf7-textarea, .wpcf7-text').each(function(){
	    	if ( !jQuery(this).hasClass('no-storage') && !jQuery(this).hasClass('.wpcf7-captchar') ){
				jQuery(this).val(localStorage.getItem('cf7_' + jQuery(this).attr('name')));
			}
	    });
    });

    //Clear localstorage when AJAX submit fails (but submit still succeeds)
    if ( window.location.hash.indexOf('wpcf7') > 0 ){
	    if ( jQuery(window.location.hash + ' .wpcf7-mail-sent-ok').length ){
		    jQuery(window.location.hash + ' .wpcf7-textarea, ' + window.location.hash + ' .wpcf7-text').each(function(){
				localStorage.removeItem('cf7_' + jQuery(this).attr('name'));
				jQuery(this).val('');
			});
	    }
    }
}

//Form live (soft) validator
function nebulaLiveValidator(){
	//Standard text inputs and select menus
	nebula.dom.document.on('keyup change blur', '.nebula-validate-text, .nebula-validate-select', function(e){
		if ( jQuery(this).val() === '' ){
			applyValidationClasses(jQuery(this), 'reset', false);
		} else if ( jQuery.trim(jQuery(this).val()).length ){
			applyValidationClasses(jQuery(this), 'success', false);
		} else {
			if ( e.type === 'keyup' ){
				applyValidationClasses(jQuery(this), 'warning', false);
			} else {
				applyValidationClasses(jQuery(this), 'danger', true);
			}
		}
	});

	//RegEx input
	nebula.dom.document.on('keyup change blur', '.nebula-validate-regex', function(e){
		var pattern = new RegExp(jQuery(this).attr('data-valid-regex'), 'i');
		if ( jQuery(this).val() === '' ){
			applyValidationClasses(jQuery(this), 'reset', false);
		} else if ( pattern.test(jQuery(this).val()) ){
			applyValidationClasses(jQuery(this), 'success', false);
		} else {
			if ( e.type === 'keyup' ){
				applyValidationClasses(jQuery(this), 'warning', false);
			} else {
				applyValidationClasses(jQuery(this), 'danger', true);
			}
		}
	});

	//URL inputs
	nebula.dom.document.on('keyup change blur', '.nebula-validate-url', function(e){
		if ( jQuery(this).val() === '' ){
			applyValidationClasses(jQuery(this), 'reset', false);
		} else if ( regexPattern.url.test(jQuery(this).val()) ){
			applyValidationClasses(jQuery(this), 'success', false);
		} else {
			if ( e.type === 'keyup' ){
				applyValidationClasses(jQuery(this), 'warning', false);
			} else {
				applyValidationClasses(jQuery(this), 'danger', true);
			}
		}
	});

	//Email address inputs
	nebula.dom.document.on('keyup change blur', '.nebula-validate-email', function(e){
		if ( jQuery(this).val() === '' ){
			applyValidationClasses(jQuery(this), 'reset', false);
		} else if ( regexPattern.email.test(jQuery(this).val()) ){
			applyValidationClasses(jQuery(this), 'success', false);
		} else {
			if ( e.type === 'keyup' ){
				applyValidationClasses(jQuery(this), 'warning', false);
			} else {
				applyValidationClasses(jQuery(this), 'danger', true);
			}
		}
	});

	//Phone number inputs
	nebula.dom.document.on('keyup change blur', '.nebula-validate-phone', function(e){
		if ( jQuery(this).val() === '' ){
			applyValidationClasses(jQuery(this), 'reset', false);
		} else if ( regexPattern.phone.test(jQuery(this).val()) ){
			applyValidationClasses(jQuery(this), 'success', false);
		} else {
			if ( e.type === 'keyup' ){
				applyValidationClasses(jQuery(this), 'warning', false);
			} else {
				applyValidationClasses(jQuery(this), 'danger', true);
			}
		}
	});

	//Date inputs
	nebula.dom.document.on('keyup change blur', '.nebula-validate-date', function(e){
		if ( jQuery(this).val() === '' ){
			applyValidationClasses(jQuery(this), 'reset', false);
		} else if ( regexPattern.date.mdy.test(jQuery(this).val()) ){ //Check for MM/DD/YYYY (and flexible variations)
			applyValidationClasses(jQuery(this), 'success', false);
		} else if ( regexPattern.date.ymd.test(jQuery(this).val()) ){ //Check for YYYY/MM/DD (and flexible variations)
			applyValidationClasses(jQuery(this), 'success', false);
		} else if ( strtotime(jQuery(this).val()) && strtotime(jQuery(this).val()) > -2208988800 ){ //Check for textual dates (after 1900) //@TODO "Nebula" 0: The JS version of strtotime() isn't the most accurate function...
			applyValidationClasses(jQuery(this), 'success', false);
		} else {
			applyValidationClasses(jQuery(this), 'danger', true);
		}
	});

	//Textarea
	nebula.dom.document.on('keyup change blur', '.nebula-validate-textarea', function(e){
		if ( jQuery(this).val() === '' ){
			applyValidationClasses(jQuery(this), 'reset', false);
		} else if ( jQuery.trim(jQuery(this).val()).length ){
			if ( e.type === 'blur' ){
				applyValidationClasses(jQuery(this), 'success', false);
			} else {
				applyValidationClasses(jQuery(this), 'reset', false); //Remove green while focused (typing)
			}
		} else {
			if ( e.type === 'blur' ){
				applyValidationClasses(jQuery(this), 'danger', true);
			} else {
				applyValidationClasses(jQuery(this), 'reset', false); //Remove green while focused (typing)
			}
		}
	});

	//Checkbox and Radio
	nebula.dom.document.on('change blur', '.nebula-validate-checkbox, .nebula-validate-radio', function(e){
		if ( jQuery(this).closest('.form-group').find('input:checked').length ){
			applyValidationClasses(jQuery(this), 'reset', false);
		} else {
			applyValidationClasses(jQuery(this), 'danger', true);
		}
	});
}

//Apply Bootstrap appropriate validation classes to appropriate elements
function applyValidationClasses(element, validation, showFeedback){
	if ( typeof element === 'string' ){
		element = jQuery(element);
	} else if ( typeof element !== 'object' ) {
		return false;
	}

	if ( validation === 'success' || validation === 'valid' ){
		element.removeClass('form-control-success form-control-warning form-control-danger wpcf7-not-valid').addClass('form-control-success')
			.closest('.form-group').removeClass('has-success has-warning has-danger').addClass('has-success')
			.find('.wpcf7-not-valid-tip').remove();
	} else if ( validation === 'warning' ){
		element.removeClass('form-control-success form-control-warning form-control-danger wpcf7-not-valid').addClass('form-control-warning')
			.closest('.form-group').removeClass('has-success has-warning has-danger').addClass('has-warning')
			.find('.wpcf7-not-valid-tip').remove();
	} else if ( validation === 'danger' || validation === 'error' || validation === 'invalid' ){
		element.removeClass('form-control-success form-control-warning form-control-danger wpcf7-not-valid').addClass('form-control-danger')
			.closest('.form-group').removeClass('has-success has-warning has-danger').addClass('has-danger');
	} else if ( validation === 'reset' || validation === 'remove' ){
		element.removeClass('form-control-success form-control-warning form-control-danger wpcf7-not-valid')
			.closest('.form-group').removeClass('has-danger has-warning has-success')
			.find('.wpcf7-not-valid-tip').remove();
	}

	if ( validation === 'feedback' || showFeedback ){
		element.closest('.form-group').find('.form-control-feedback').removeClass('hidden');
	} else {
		element.closest('.form-group').find('.form-control-feedback').addClass('hidden');
	}
}

//Google AdWords conversion tracking for AJAX forms
//Contact Form 7 - Add on_sent_ok: "conversionTracker();" to Additional Settings
//Parameter should be either boolean (to use thanks.html) or string of another conversion page to use (Default: false).
function conversionTracker(conversionpage){
	if ( typeof conversionpage !== 'string' || conversionpage.indexOf('.') <= 0 ){
		conversionpage = 'thanks.html';
	}

	var iframe = document.createElement('iframe');
	iframe.style.width = '0px';
	iframe.style.height = '0px';
	document.body.appendChild(iframe);
	iframe.src = nebula.site.directory.template.uri + '/inc/conversion/' + conversionpage; //@todo "Nebula" 0: Does this need to be updated to support child themes?
};


/*==========================
 Optimization Functions
 ===========================*/

//Conditional JS Library Loading
function conditionalJSLoading(){
	//Load the Google Maps API if 'googlemap' class exists
	if ( jQuery('.googlemap').length ){
		if ( typeof google == "undefined" || !has(google, 'maps') ){ //If the API has not already been called
			jQuery.getScript('https://www.google.com/jsapi?key=' + nebula.site.options.nebula_google_browser_api_key, function(){
			    google.load('maps', '3', {
			        callback: function(){
			        	nebula.dom.document.trigger('nebula_google_maps_api_loaded');
			        }
			    });
			}).fail(function(){
			    ga('send', 'exception', {'exDescription': 'Google Maps JS API script could not be loaded', 'exFatal': false});
			});
		}
	}

	//Only load Chosen library if 'chosen-select' class exists.
	if ( jQuery('.chosen-select').length ){
		jQuery.getScript(nebula.site.resources.js.chosen).done(function(){
			chosenSelectOptions();
		}).fail(function(){
			ga('send', 'exception', {'exDescription': 'chosen.jquery.min.js could not be loaded', 'exFatal': false});
			nv('append', {'js_errors': 'chosen.jquery.min.js could not be loaded'});
		});
		nebulaLoadCSS(nebula.site.resources.css.chosen);
	}

	//Only load dataTables library if dataTables table exists.
    if ( jQuery('.dataTables_wrapper').length ){
        jQuery.getScript(nebula.site.resources.js.datatables).done(function(){
            nebulaLoadCSS(nebula.site.resources.css.datatables);
			dataTablesActions(); //Once loaded, call the DataTables actions. This can be called or overwritten in child.js (or elsewhere)
			nebula.dom.document.trigger('nebula_datatables_loaded'); //This event can be listened for in child.js (or elsewhere) for when DataTables has finished loading.
        }).fail(function(){
            ga('send', 'exception', {'exDescription': 'jquery.dataTables.min.js could not be loaded', 'exFatal': false});
            nv('append', {'js_errors': 'jquery.dataTables.min.js could not be loaded'});
        });
    }

	//Only load Tether library when Bootstrap tooltips are present.
	if ( jQuery('[data-toggle="tooltip"]').length ){
		jQuery.getScript(nebula.site.resources.js.tether).fail(function(){
            ga('send', 'exception', {'exDescription': 'tether.min.js could not be loaded', 'exFatal': false});
            nv('append', {'js_errors': 'tether.min.js could not be loaded'});
        });
	}

	if ( jQuery('pre.nebula-code').length || jQuery('pre.nebula-code').length ){
		nebulaLoadCSS(nebula.site.resources.css.pre);
		nebulaPre();
	}

	if ( jQuery('.flag').length ){
		nebulaLoadCSS(nebula.site.resources.css.flags);
	}
}

//Dynamically load CSS files using JS
function nebulaLoadCSS(url){
	if ( document.createStyleSheet ){
	    try {
		    document.createStyleSheet(url);
	    } catch(e){
		    ga('send', 'exception', {'exDescription': url + ' could not be loaded', 'exFatal': false});
		    nv('append', {'css_errors': url + ' could not be loaded'});
	    }
	} else {
	    var css;
	    css = document.createElement('link');
	    css.rel = 'stylesheet';
	    css.type = 'text/css';
	    css.media = "all";
	    css.href = url;
	    document.getElementsByTagName("head")[0].appendChild(css);
	}
}


/* ==========================================================================
   Google Maps Functions
   ========================================================================== */

//Places - Address Autocomplete
//This uses the Google Maps Geocoding API
//The passed selector must be an input element
function nebulaAddressAutocomplete(autocompleteInput, name){
	if ( jQuery(autocompleteInput).length && jQuery(autocompleteInput).is('input') ){ //If the addressAutocomplete ID exists
		if ( typeof google != "undefined" && has(google, 'maps') ){
			googleAddressAutocompleteCallback(autocompleteInput, name);
		} else {
			debounce(function(){
				jQuery.getScript('https://www.google.com/jsapi', function(){
				    google.load('maps', '3', {
					    other_params: 'libraries=places&key=' + nebula.site.options.nebula_google_browser_api_key,
					    callback: function(){
							googleAddressAutocompleteCallback(autocompleteInput, name);
					    }
				    });
				}).fail(function(){
					ga('send', 'exception', {'exDescription': 'Google Maps Places script could not be loaded', 'exFatal': false});
					nv('append', {'js_errors': 'Google Maps Places script could not be loaded'});
				});
			}, 100, 'google maps script load');
		}
	}
}

function googleAddressAutocompleteCallback(autocompleteInput, name){
	if ( !name ){
		name = 'addressAutocomplete';
	}

	window[name] = new google.maps.places.Autocomplete(
		jQuery(autocompleteInput)[0],
		{types: ['geocode']} //Restrict the search to geographical location types
	);

	google.maps.event.addListener(window[name], 'place_changed', function(){ //When the user selects an address from the dropdown, populate the address fields in the form.
		place = window[name].getPlace(); //Get the place details from the window[name] object.

		nebula.user.address = {
			street: {
				number: null,
				name: null,
				full: null,
			},
			city: null,
			county: null,
			state: {
				name: null,
				abbreviation: null,
			},
			country: {
				name: null,
				abbreviation: null,
			},
			zip: {
				code: null,
				suffix: null,
				full: null,
			},
		};

		for ( var i = 0; i < place.address_components.length; i++ ){
			//Lots of different address types. This function uses only the common ones: https://developers.google.com/maps/documentation/geocoding/#Types
			switch ( place.address_components[i].types[0] ){
				case "street_number":
					nebula.user.address.street.number = place.address_components[i].short_name; //123
					break;
				case "route":
					nebula.user.address.street.name = place.address_components[i].long_name; //Street Name Rd.
					break;
				case "locality":
					nebula.user.address.city = place.address_components[i].long_name; //Liverpool
					break;
				case "administrative_area_level_2":
					nebula.user.address.county = place.address_components[i].long_name; //Onondaga County
					break;
				case "administrative_area_level_1":
					nebula.user.address.state.name = place.address_components[i].long_name; //New York
					nebula.user.address.state.abbr = place.address_components[i].short_name; //NY
					break;
				case "country":
					nebula.user.address.country.name = place.address_components[i].long_name; //United States
					nebula.user.address.country.abbr = place.address_components[i].short_name; //US
					break;
				case "postal_code":
					nebula.user.address.zip.code = place.address_components[i].short_name; //13088
					break;
				case "postal_code_suffix":
					nebula.user.address.zip.suffix = place.address_components[i].short_name; //4725
					break;
				default:
					//console.log('Address component ' + place.address_components[i].types[0] + ' not used.');
			}
		}
		if ( has(nebula, 'user.address.street') ){
			nebula.user.address.street.full = nebula.user.address.street.number + ' ' + nebula.user.address.street.name;
		}
		if ( has(nebula, 'user.address.zip') ){
			nebula.user.address.zip.full = nebula.user.address.zip.code + '-' + nebula.user.address.zip.suffix;
		}

		nebula.dom.document.trigger('nebula_address_selected', [place, jQuery(autocompleteInput)]);
		ga('set', gaCustomDimensions['contactMethod'], 'Autocomplete Address');
		ga('send', 'event', 'Contact', 'Autocomplete Address', nebula.user.address.city + ', ' + nebula.user.address.state.abbreviation + ' ' + nebula.user.address.zip.code);

		//@TODO "Nebula" 0: If errors, consider switching each to (ex:) 'street_number': ( has(nebula, 'user.address.street') )? nebula.user.address.street.number : ''
		nv('send', {
			'street_number': nebula.user.address.street.number,
			'street_name': nebula.user.address.street.name,
			'street_full': nebula.user.address.street.full,
			'city': nebula.user.address.city,
			'county': nebula.user.address.county,
			'state_name': nebula.user.address.state.name,
			'state_abbr': nebula.user.address.state.abbr,
			'country_name': nebula.user.address.country.name,
			'country_abbr': nebula.user.address.country.abbr,
			'zip_code': nebula.user.address.zip.code,
			'zip_suffix': nebula.user.address.zip.suffix,
			'zip_full': nebula.user.address.zip.full,
		});
		nv('append', {'address_full': nebula.user.address.street.full + ', ' + nebula.user.address.city + ', ' + nebula.user.address.state.abbr + ' ' + nebula.user.address.zip.code});
	});

	jQuery(autocompleteInput).on('focus', function(){
		if ( nebula.site.protocol === 'https' && navigator.geolocation ){
			navigator.geolocation.getCurrentPosition(function(position){ //Bias to the user's geographical location.
				var geolocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
				var circle = new google.maps.Circle({
					center: geolocation,
					radius: position.coords.accuracy
				});
				window[name].setBounds(circle.getBounds());
			});
		}
	}).on('keydown', function(e){
		if ( e.which === 13 && jQuery('.pac-container:visible').length ){ //Prevent form submission when enter key is pressed while the "Places Autocomplete" container is visbile
			return false;
		}
	});

	if ( autocompleteInput === '#address-autocomplete' ){
		nebula.dom.document.on('nebula_address_selected', function(){
			//do any default stuff here.
		});
	}
}

//Request Geolocation
function requestPosition(){
	if ( typeof google != "undefined" && has(google, 'maps') ){
		jQuery.getScript('https://www.google.com/jsapi', function(){
			google.load('maps', '3', {
				other_params: 'libraries=places&key=' + nebula.site.options.nebula_google_browser_api_key,
				callback: getCurrentPosition()
			}); //End Google Maps load
		}).fail(function(){
			ga('send', 'exception', {'exDescription': 'Google Maps Places script could not be loaded', 'exFatal': false});
		});
	} else {
		getCurrentPosition();
	}
}

function getCurrentPosition(){
	var nav = null;
    if (nav === null){
        nav = window.navigator;
    }
    var geolocation = nav.geolocation;
    if ( geolocation != null ){
        geolocation.getCurrentPosition(geoSuccessCallback, geoErrorCallback, {enableHighAccuracy: true}); //One-time location poll
        //geoloc.watchPosition(successCallback, errorCallback, {enableHighAccuracy: true}); //Continuous location poll (This will update the nebula.session.geolocation object regularly, but be careful sending events to GA- may result in TONS of events)
    }
}

//Geolocation Success
function geoSuccessCallback(position){
	nebula.session.geolocation = {
        error: false,
        coordinates: { //A value in decimal degrees to an precision of 4 decimal places is precise to 11.132 meters at the equator. A value in decimal degrees to 5 decimal places is precise to 1.1132 meter at the equator.
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        },
        accuracy: {
            meters: position.coords.accuracy,
            miles: (position.coords.accuracy*0.000621371).toFixed(2),
        },
        altitude: { //Above the mean sea level
	        meters: position.coords.altitude,
	        miles: (position.coords.altitude*0.000621371).toFixed(2),
	        accuracy: position.coords.altitudeAccuracy,
        },
        speed: {
	        mps: position.coords.speed,
	        kph: (position.coords.speed*3.6).toFixed(2),
	        mph: (position.coords.speed*2.23694).toFixed(2),
        },
        heading: position.coords.heading, //Degrees clockwise from North
        address: false
    }

	if ( nebula.session.geolocation.accuracy.meters < 50 ){
		nebula.session.geolocation.accuracy.color = '#00bb00';
        ga('set', gaCustomDimensions['geoAccuracy'], 'Excellent (<50m)');
    } else if ( nebula.session.geolocation.accuracy.meters > 50 && nebula.session.geolocation.accuracy.meters < 300 ){
        nebula.session.geolocation.accuracy.color = '#a4ed00';
        ga('set', gaCustomDimensions['geoAccuracy'], 'Good (50m - 300m)');
    } else if ( nebula.session.geolocation.accuracy.meters > 300 && nebula.session.geolocation.accuracy.meters < 1500 ){
        nebula.session.geolocation.accuracy.color = '#ffc600';
        ga('set', gaCustomDimensions['geoAccuracy'], 'Poor (300m - 1500m)');
    } else {
        nebula.session.geolocation.accuracy.color = '#ff1900';
        ga('set', gaCustomDimensions['geoAccuracy'], 'Very Poor (>1500m)');
    }

	addressLookup(position.coords.latitude, position.coords.longitude);

	sessionStorage['nebulaSession'] = JSON.stringify(nebula.session);
	nebula.dom.document.trigger('geolocationSuccess');
	nebula.dom.body.addClass('geo-latlng-' + nebula.session.geolocation.coordinates.latitude.toFixed(4).replace('.', '_') + '_' + nebula.session.geolocation.coordinates.longitude.toFixed(4).replace('.', '_') + ' geo-acc-' + nebula.session.geolocation.accuracy.meters.toFixed(0).replace('.', ''));
	ga('set', gaCustomDimensions['geolocation'], nebula.session.geolocation.coordinates.latitude.toFixed(4) + ', ' + nebula.session.geolocation.coordinates.longitude.toFixed(4));
	ga('send', 'event', 'Geolocation', nebula.session.geolocation.coordinates.latitude.toFixed(4) + ', ' + nebula.session.geolocation.coordinates.longitude.toFixed(4), 'Accuracy: ' + nebula.session.geolocation.accuracy.meters.toFixed(2) + ' meters');
	nv('send', {'geo_latitude': nebula.session.geolocation.coordinates.latitude.toFixed(4), 'geo_longitude': nebula.session.geolocation.coordinates.longitude.toFixed(4), 'geo_accuracy': nebula.session.geolocation.accuracy.meters.toFixed(2) + ' meters'});
	nv('append', {'geolocation': nebula.session.geolocation.coordinates.latitude.toFixed(4) + ', ' + nebula.session.geolocation.coordinates.longitude.toFixed(4) + ' (' + nebula.session.geolocation.accuracy.meters.toFixed(2) + ' meters)'});
}

//Geolocation Error
function geoErrorCallback(error){
    switch (error.code){
        case error.PERMISSION_DENIED:
            geolocationErrorMessage = 'Access to your location is turned off. Change your settings to report location data.';
            var geoErrorNote = 'Denied';
            break;
        case error.POSITION_UNAVAILABLE:
            geolocationErrorMessage = "Data from location services is currently unavailable.";
            var geoErrorNote = 'Unavailable';
            break;
        case error.TIMEOUT:
            geolocationErrorMessage = "Location could not be determined within a specified timeout period.";
            var geoErrorNote = 'Timeout';
            break;
        default:
        	geolocationErrorMessage = "An unknown error has occurred.";
        	var geoErrorNote = 'Error';
            break;
    }

    nebula.session.geolocation = {
	    error: {
		    code: error.code,
			description: geolocationErrorMessage
	    }
    }

    nebula.dom.document.trigger('geolocationError');
    nebula.dom.body.addClass('geo-error');
    ga('set', gaCustomDimensions['geolocation'], geolocationErrorMessage);
    ga('send', 'exception', {'exDescription': 'Geolocation error: ' + geolocationErrorMessage, 'exFatal': false});
    nv('append', {'js_errors': geolocationErrorMessage});
}


//Rough address Lookup
//If needing to look up an address that isn't the user's geolocation based on lat/long, consider a different function. This one stores user data.
function addressLookup(lat, lng){
	geocoder = new google.maps.Geocoder();
	latlng = new google.maps.LatLng(lat, lng); //lat, lng
	geocoder.geocode({'latLng': latlng}, function(results, status){
		if ( status === google.maps.GeocoderStatus.OK ){
			if ( results ){
				nebula.session.geolocation.address = {
					number: extractFromAddress(results[0].address_components, "street_number"),
					street: extractFromAddress(results[0].address_components, "route"),
					city: extractFromAddress(results[0].address_components, "locality"),
					town: extractFromAddress(results[0].address_components, "administrative_area_level_3"),
					county: extractFromAddress(results[0].address_components, "administrative_area_level_2"),
					state: extractFromAddress(results[0].address_components, "administrative_area_level_1"),
					country: extractFromAddress(results[0].address_components, "country"),
					zip: extractFromAddress(results[0].address_components, "postal_code"),
					formatted: results[0].formatted_address,
					place: {
						id: results[0].place_id,
					},
				};
				nv('append', {'address_lookup': results[0].formatted_address}); //append instead?

				sessionStorage['nebulaSession'] = JSON.stringify(nebula.session);
				nebula.dom.document.trigger('addressSuccess');
				if ( nebula.session.geolocation.accuracy.meters < 100 ){
					placeLookup(results[0].place_id);
				}
			}
		}
	});
}

//Extract address components from Google Maps Geocoder
function extractFromAddress(components, type){
	for ( var i = 0; i < components.length; i++ ){
		for ( var j = 0; j < components[i].types.length; j++ ){
			if ( components[i].types[j] === type ){
				return components[i].long_name;
			}
		}
	}

	return '';
}

//Lookup place information
function placeLookup(placeID){
	var service = new google.maps.places.PlacesService(jQuery('<div></div>').get(0));
	service.getDetails({
		placeId: placeID
	}, function(place, status){
		if ( status === google.maps.places.PlacesServiceStatus.OK ){
			if ( typeof place.name !== 'undefined' ){
				nebula.session.geolocation.address.place = {
					id: placeID,
					name: place.name,
					url: place.url,
					website: place.website,
					phone: place.formatted_phone_number,
					ratings: {
						rating: place.rating,
						total: place.user_ratings_total,
						reviews: ( typeof place.reviews !== 'undefined' )? place.reviews.length : 0,
					},
					utc_offset: place.utc_offset,
				}

				sessionStorage['nebulaSession'] = JSON.stringify(nebula.session);
				nebula.dom.document.trigger('placeSuccess');
			}
		}
	});
}

/*==========================
 Helper Functions
 These functions enhance other aspects of the site like HTML/CSS.
 ===========================*/

//Zebra-striper, First-child/Last-child, Hover helper functions, add "external" rel to outbound links
function addHelperClasses(){
	jQuery("a[href^='http']:not([href*='" + nebula.site.domain + "'])").attr('rel', 'nofollow external noopener'); //Add rel attributes to external links

	//Remove filetype icons from images within <a> tags and buttons.
	jQuery('a img').closest('a').addClass('no-icon');
	jQuery('.no-icon:not(a)').find('a').addClass('no-icon');
}

function initBootstrapFunctions(){
	//Tooltips
	if ( jQuery('[data-toggle="tooltip"]').length ){
		jQuery('[data-toggle="tooltip"]').tooltip();
	}

	//Carousels - Override this to customize options
	if ( jQuery('.carousel').length ){
		jQuery('.carousel').each(function(){
			if ( jQuery(this).hasClass('auto-indicators') ){
				var carouselID = jQuery(this).attr('id');
				var slideCount = jQuery(this).find('.carousel-item').length;

				var i = 0;
				var markup = '<ol class="carousel-indicators">'; //@TODO "Nebula" 0: Why is there no space between indicators when using this auto-indicators?
				while ( i < slideCount ){
					var active = ( i === 0 )? 'class="active"' : '';
					markup += '<li data-target="#' + carouselID + '" data-slide-to="' + i + '" ' + active + '></li>';
					i++;
				}
				markup += '</ol>';
				jQuery(this).prepend(markup);
				jQuery(this).find('.carousel-item').first().addClass('active');

				if ( !jQuery(this).find('.carousel-inner').length ){
					jQuery(this).find('.carousel-item').wrapAll('<div class="carousel-inner">');
				}
			}

			jQuery(this).carousel();
		});
	}
}

//Try to fix some errors automatically
function errorMitigation(){
	//Try to fall back to .png on .svg errors. Else log the broken image.
	jQuery('img').on('error', function(){
		thisImage = jQuery(this);
		imagePath = thisImage.attr('src');
		if ( imagePath.split('.').pop() === 'svg' ){
			fallbackPNG = imagePath.replace('.svg', '.png');
			jQuery.get(fallbackPNG).done(function(){
				thisImage.prop('src', fallbackPNG);
				thisImage.removeClass('svg');
			}).fail(function() {
				ga('send', 'exception', {'exDescription': 'Broken Image: ' + imagePath, 'exFatal': false});
				nv('append', {'html_errors': 'Broken Image: ' + imagePath});
			});
		} else {
			ga('send', 'exception', {'exDescription': 'Broken Image: ' + imagePath, 'exFatal': false});
			nv('append', {'html_errors': 'Broken Image: ' + imagePath});
		}
	});
}

//Convert img tags with class .svg to raw SVG elements
function svgImgs(){
	jQuery('img.svg').each(function(){
        var oThis = jQuery(this);

		if ( oThis.attr('src').indexOf('.svg') >= 1 ){
	        jQuery.get(oThis.attr('src'), function(data){
	            var theSVG = jQuery(data).find('svg'); //Get the SVG tag, ignore the rest
	            theSVG = theSVG.attr('id', oThis.attr('id')); //Add replaced image's ID to the new SVG
	            theSVG = theSVG.attr('class', oThis.attr('class') + ' replaced-svg'); //Add replaced image's classes to the new SVG
	            theSVG = theSVG.attr('data-original-src', oThis.attr('src')); //Add an attribute of the original SVG location
	            theSVG = theSVG.removeAttr('xmlns:a'); //Remove invalid XML tags
	            oThis.replaceWith(theSVG); //Replace image with new SVG
	        }, 'xml');
        }
    });
}

//Column height equalizer
function nebulaEqualize(){
	jQuery('.row.equalize').each(function(){
		var oThis = jQuery(this);
		tallestColumn = 0;
		oThis.children('[class*="col-"]').css('min-height', '0').each(function(i){
			if ( !jQuery(this).hasClass('no-equalize') ){
				columnHeight = jQuery(this).outerHeight();
				if ( columnHeight > tallestColumn ){
					tallestColumn = columnHeight;
				}
			}
		});
		oThis.attr('data-equalized', tallestColumn).find('[class*="col-"]:not(.no-equalize)').css('min-height', tallestColumn);
		nebula.dom.document.trigger('nebula_equalized');
	});

	nebula.dom.document.on('nebula_infinite_finish', function(){
		nebulaEqualize();
	});
}

//Offset must be an integer
function nebulaScrollTo(element, milliseconds, offset, onlyWhenBelow, callback){
	if ( !offset ){
		var offset = 0; //Note: This selector should be the height of the fixed header, or a hard-coded offset.
	}

	//Call this function with a jQuery object to trigger scroll to an element (not just a selector string).
	if ( element ){
		if ( typeof element === 'string' ){
			element = jQuery(element);
		}

		var willScroll = true;
		if ( onlyWhenBelow ){
			var elementTop = element.offset().top-offset;
			var viewportTop = nebula.dom.document.scrollTop();
			if ( viewportTop-elementTop <= 0 ){
				willScroll = false;
			}
		}

		if ( willScroll ){
			if ( !milliseconds ){
				var milliseconds = 500;
			}

			jQuery('html, body').animate({
				scrollTop: element.offset().top-offset
			}, milliseconds, function(){
				if ( callback ){
					callback();
				}
			});
		}

		return false;
	}

	nebula.dom.document.on('click touch tap', 'a[href^="#"]:not([href="#"])', function(){ //Using an ID as the href.
		var avoid = '.no-scroll, .mm-menu, .carousel, .tab-content, .modal, [data-toggle]';
		if ( jQuery(this).is(avoid) || jQuery(this).parents(avoid).length ){
			return false;
		}

		pOffset = ( jQuery(this).attr('offset') )? parseFloat(jQuery(this).attr('offset')) : 0;
		if ( location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') && location.hostname === this.hostname ){
			var target = jQuery(this.hash) || jQuery('[name=' + this.hash.slice(1) +']');
			if ( target.length ){ //If target exists
				var nOffset = Math.floor(target.offset().top-offset+pOffset);
				jQuery('html, body').animate({
					scrollTop: nOffset
				}, 500);
				return false;
			}
		}
	});

	nebula.dom.document.on('click tap touch', '.nebula-scrollto', function(){ //Using the nebula-scrollto class with scrollto attribute.
		pOffset = ( jQuery(this).attr('offset') )? parseFloat(jQuery(this).attr('offset')) : 0;
		if ( jQuery(this).attr('scrollto') ){
			var scrollElement = jQuery(this).attr('scroll-to');
			if ( scrollElement !== '' ){
				jQuery('html, body').animate({
					scrollTop: Math.floor(jQuery(scrollElement).offset().top-offset+pOffset)
				}, 500);
			}
		}
		return false;
	});
}


/*==========================
 Utility Functions
 These functions simplify and enhance other JavaScript functions
 ===========================*/

//Get query string parameters
function getQueryStrings(){
	var queries = {};
    var queryString = document.URL.split('?')[1];
    if ( queryString ){
        queryStrings = queryString.split('&');
        for ( var i = 0; i < queryStrings.length; i++ ){
            hash = queryStrings[i].split('=');
            if ( hash[1] ){
	            queries[hash[0]] = hash[1];
            } else {
	            queries[hash[0]] = true;
            }
        }
	}

	return queries;
}

//Search query strings for the passed parameter
function get(parameter){
	var queries = getQueryStrings();

	if ( !parameter ){
		return queries;
	} else {
		return queries[parameter];
	}
	return false;
}

//Remove a parameter from the query string.
function removeQueryParameter(key, sourceURL){
    var rtn = sourceURL.split('?')[0],
        param,
        params_arr = [],
        queryString = (sourceURL.indexOf('?') !== -1) ? sourceURL.split('?')[1] : '';

    if ( queryString !== '' ){
        params_arr = queryString.split('&');

        for ( i = params_arr.length-1; i >= 0; i -= 1 ){
            param = params_arr[i].split('=')[0];
            if ( param === key ){
                params_arr.splice(i, 1);
            }
        }

        rtn = rtn + '?' + params_arr.join('&');
    }

	//Check if it is empty after parameter removal
	if ( rtn.split('?')[1] === '' ){
		return rtn.split("?")[0]; //Return the URL without a query
	}

    return rtn;
}

//Trigger a reflow on an element.
//This is useful for repeating animations.
function reflow(selector){
	if ( typeof selector === 'string' ){
		var element = jQuery(selector);
	} else if ( typeof selector === 'object' ) {
		var element = selector;
	} else {
		return false;
	}

	element.width();
}

//Handle repeated animations in a single function.
function nebulaAnimate(selector, newAnimationClasses, oldAnimationClasses){
	if ( typeof selector === 'string' ){
		var element = jQuery(selector);
	} else if ( typeof selector === 'object' ) {
		var element = selector;
	} else {
		return false;
	}

	newAnimationClasses += ' animate';
	element.removeClass(newAnimationClasses); //Remove classes first so they can be re-added.

	if ( oldAnimationClasses ){
		element.removeClass(oldAnimationClasses); //Remove conflicting animation classes.
	}

	reflow(element); //Refresh the element so it can be animated again.
	element.addClass(newAnimationClasses); //Animate the element.
}

//Helpful animation event listeners
function animationTriggers(){
	//On document ready
	jQuery('.ready').each(function(){
		loadAnimate(jQuery(this));
	});

	//On window load
	nebula.dom.window.on('load', function(){
		jQuery('.load').each(function(){
			loadAnimate(jQuery(this));
		});
	});

	//On click
	nebula.dom.document.on('click tap touch', '.click, [nebula-click]', function(){
		var animationClass = jQuery(this).attr('nebula-click') || '';
		nebulaAnimate(jQuery(this), animationClass);
	});
}

function loadAnimate(oThis){
	animationDelay = oThis.attr('nebula-delay');
	if ( typeof animationDelay === 'undefined' || animationDelay === 0 ){
		nebulaAnimate(oThis, 'load-animate');
	} else {
		setTimeout(function(){
			nebulaAnimate(oThis, 'load-animate');
		}, animationDelay);
	}
}

//Allows something to be called once per pageload.
//Call without self-executing parenthesis in the parameter! Ex: once(customFunction, 'test example');
//To add parameters, use an array as the 2nd parameter. Ex: once(customFunction, ['parameter1', 'parameter2'], 'test example');
//Can be used for boolean. Ex: once('boolean test');
function once(fn, args, unique){
	if ( typeof onces === 'undefined' ){
		onces = {};
	}

	if ( typeof args === 'string' ){ //If no parameters
		unique = args;
		args = [];
	}

	//Reset all
	if ( fn === 'clear' || fn === 'reset' ){
		onces = {};
	}

	//Remove a single entry
	if ( fn === 'remove' ){
		delete onces[unique];
	}

	if ( typeof fn === 'function' ){ //If the first parameter is a function
		if ( typeof onces[unique] === 'undefined' || !onces[unique] ){
			onces[unique] = true;
			return fn.apply(this, args);
		}
	} else { //Else return boolean
		unique = fn; //If only one parameter is passed
		if ( typeof onces[unique] === 'undefined' || !onces[unique] ){
			onces[unique] = true;
			return true;
		} else {
			return false;
		}
	}
}

//Waits for events to finish before triggering
//Passing immediate triggers the function on the leading edge (instead of the trailing edge).
function debounce(callback, wait, uniqueId, immediate){
	if ( typeof debounceTimers === "undefined" ){
		debounceTimers = {};
	}

    if ( !uniqueId ){
		uniqueId = "Don't call this twice without a uniqueId";
	}

    var context = this, args = arguments;
    var later = function(){
        debounceTimers[uniqueId] = null;
        if ( !immediate ){
	        callback.apply(context, args);
	    }
    };
    var callNow = immediate && !debounceTimers[uniqueId];

    clearTimeout(debounceTimers[uniqueId]);
    debounceTimers[uniqueId] = setTimeout(later, wait);
    if ( callNow ){
	    callback.apply(context, args);
	}
};

//Cookie Management
function createCookie(name, value, days){
	if ( !days ){
		var days = 3650; //10 years
	}

	if ( days ){
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires=" + date.toGMTString();
	} else {
		var expires = "";
	}
	document.cookie = name + "=" + value + expires + "; path=/";
}
function readCookie(name){
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for ( var i = 0; i < ca.length; i++ ){
		var c = ca[i];
		while ( c.charAt(0) === ' ' ){
			c = c.substring(1, c.length);
			if ( c.indexOf(nameEQ) === 0 ){
				return c.substring(nameEQ.length, c.length);
			}
		}
	}
	return null;
}
function eraseCookie(name){
	createCookie(name, "", -1);
}

//Time specific events. Unique ID is required. Returns time in milliseconds.
//Data can be accessed outside of this function via nebulaTimings array.
function nebulaTimer(uniqueID, action, name){
	if ( typeof window.nebulaTimings === 'undefined' ){
		window.nebulaTimings = [];
	}

	//uniqueID is required
	if ( !uniqueID || uniqueID === 'start' || uniqueID === 'lap' || uniqueID === 'end' ){
		return false;
	}

	if ( !action ){
		if ( typeof nebulaTimings[uniqueID] === 'undefined' ){
			action = 'start';
		} else {
			action = 'lap';
		}
	}

	//Can not lap or end a timing that has not started.
	if ( action !== 'start' && typeof nebulaTimings[uniqueID] === 'undefined' ){
		return false;
	}

	//Can not modify a timer once it has ended.
	if ( typeof nebulaTimings[uniqueID] !== 'undefined' && nebulaTimings[uniqueID].total > 0 ){
		return nebulaTimings[uniqueID].total;
	}

	//Update the timing data!
	currentTime = performance.now();

	if ( action === 'start' && typeof nebulaTimings[uniqueID] === 'undefined' ){
		nebulaTimings[uniqueID] = {};
		nebulaTimings[uniqueID].started = currentTime;
		nebulaTimings[uniqueID].cumulative = 0;
		nebulaTimings[uniqueID].total = 0;
		nebulaTimings[uniqueID].lap = [];
		nebulaTimings[uniqueID].laps = 0;

		thisLap = {
			name: false,
			started: currentTime,
			stopped: 0,
			duration: 0,
			progress: 0,
		};
		nebulaTimings[uniqueID].lap.push(thisLap);

		if ( typeof name !== 'undefined' ){
			nebulaTimings[uniqueID].lap[0].name = name;
		}

		//Add the time to User Timing API (if supported)
		if ( typeof performance.measure !== 'undefined' ){
			performance.mark(uniqueID + '_start');
		}
	} else {
		lapNumber = nebulaTimings[uniqueID].lap.length;

		//Finalize the times for the previous lap
		nebulaTimings[uniqueID].lap[lapNumber-1].stopped = currentTime;
		nebulaTimings[uniqueID].lap[lapNumber-1].duration = currentTime-nebulaTimings[uniqueID].lap[lapNumber-1].started;
		nebulaTimings[uniqueID].lap[lapNumber-1].progress = currentTime-nebulaTimings[uniqueID].started;
		nebulaTimings[uniqueID].cumulative = currentTime-nebulaTimings[uniqueID].started;

		//An "out" lap means the timing for this lap may not be associated directly with the action (Usually resetting for the next actual timed lap).
		if ( action === 'start' ){
			nebulaTimings[uniqueID].lap[lapNumber-1].out = true; //If another 'start' was sent, then the previous lap was an out lap
		} else {
			nebulaTimings[uniqueID].lap[lapNumber-1].out = false;
		}

		//Prepare the current lap
		if ( action !== 'end' ){
			nebulaTimings[uniqueID].laps++;
			if ( lapNumber > 0 ){
				nebulaTimings[uniqueID].lap[lapNumber] = {};
				nebulaTimings[uniqueID].lap[lapNumber].started = nebulaTimings[uniqueID].lap[lapNumber-1].stopped;
			}

			if ( typeof name !== 'undefined' ){
				nebulaTimings[uniqueID].lap[lapNumber].name = name;
			}

			//Add the time to User Timing API (if supported)
			if ( typeof performance.measure !== 'undefined' ){
				var lapID = name || lapNumber;
				performance.mark(uniqueID + '_lap-' + lapID);
			}
		}

		//Return individual lap times unless 'end' is passed- then return total duration. Note: 'end' can not be updated more than once per uniqueID! Subsequent calls will return the total duration from first call.
		if ( action === 'end' ){
			//Add the time to User Timing API (if supported)
			if ( typeof performance.measure !== 'undefined' ){
				performance.mark(uniqueID + '_end');

				if ( performance.getEntriesByName(uniqueID + '_start', 'mark') ){ //Make sure the start mark exists
					performance.measure(uniqueID, uniqueID + '_start', uniqueID + '_end');
				}
			}

			nebulaTimings[uniqueID].stopped = currentTime;
			nebulaTimings[uniqueID].total = currentTime-nebulaTimings[uniqueID].started;
			//@todo "Nebula" 0: Add all hot laps together (any non-"out" laps)
			return nebulaTimings[uniqueID].total;
		} else {
			if ( !nebulaTimings[uniqueID].lap[lapNumber-1].out ){
				return nebulaTimings[uniqueID].lap[lapNumber-1].duration;
			}
		}
	}
}

//Convert milliseconds into separate hours, minutes, and seconds string (Ex: "3h 14m 35.2s").
function millisecondsToString(ms){
	var milliseconds = parseInt((ms%1000)/100);
	var seconds = parseInt((ms/1000)%60);
	var minutes = parseInt((ms/(1000*60))%60);
	var hours = parseInt((ms/(1000*60*60))%24);

	var timeString = '';
	if ( hours > 0 ){
		timeString += hours + 'h ';
	}
	if ( minutes > 0 ){
		timeString += minutes + 'm ';
	}
	if ( seconds > 0 || milliseconds > 0 ){
		timeString += seconds;

		if ( milliseconds > 0 ){
			timeString += '.' + milliseconds;
		}

		timeString += 's';
	}
	return timeString;
}

//Convert time to relative.
//For cross-browser support, timestamp must be passed as a string (not a Date object) in the format: Fri Mar 27 21:40:02 +0000 2016
function timeAgo(timestamp){ //http://af-design.com/blog/2009/02/10/twitter-like-timestamps/
	if ( typeof timestamp === 'object' ){
		console.warn('Pass date as string in the format: Fri Mar 27 21:40:02 +0000 2016');
	}

	var postDate = new Date(timestamp);
	var currentTime = new Date();

	//Browser sanitation
	if ( jQuery('body').hasClass('internet_explorer') || jQuery('body').hasClass('microsoft_edge') ){
		postDate = Date.parse(timestamp.replace(/( \+)/, ' UTC$1'));
	}

	var diff = Math.floor((currentTime-postDate)/1000);
	if ( diff <= 1 ){ return "just now"; }
	if ( diff < 20 ){ return diff + " seconds ago"; }
	if ( diff < 60 ){ return "less than a minute ago"; }
	if ( diff <= 90 ){ return "one minute ago"; }
	if ( diff <= 3540 ){ return Math.round(diff/60) + " minutes ago"; }
	if ( diff <= 5400 ){ return "1 hour ago"; }
	if ( diff <= 86400 ){ return Math.round(diff/3600) + " hours ago"; }
	if ( diff <= 129600 ){ return "1 day ago"; }
	if ( diff < 604800 ){ return Math.round(diff/86400) + " days ago"; }
	if ( diff <= 777600 ){ return "1 week ago"; }

	return "on " + timestamp;
}

//Check nested objects (boolean). Note: This function can not check if the object itself exists.
//has(nebula, 'user.client.remote_addr'); //Ex: object nebula must exist first (check for it separately)
function has(obj, prop){
	var parts = prop.split('.');
	for ( var i = 0, l = parts.length; i < l; i++ ){
		var part = parts[i];
		if ( obj !== null && typeof obj === "object" && part in obj ){
			obj = obj[part];
		} else {
			return false;
		}
	}

	return true;
}

/*==========================
 Miscellaneous Functions
 ===========================*/

//Functionality for selecting and copying text using Nebula Pre tags.
function nebulaPre(){
	try {
		if ( document.queryCommandEnabled("SelectAll") ){ //@TODO "Nebula" 0: If using document.queryCommandSupported("copy") it always returns false (even though it does actually work when execCommand('copy') is called.
			var selectCopyText = 'Copy to clipboard';
		} else if ( document.body.createTextRange || window.getSelection ){
			var selectCopyText = 'Select All';
		} else {
			return false;
		}
	} catch(err){
		if ( document.body.createTextRange || window.getSelection ){
			var selectCopyText = 'Select All';
		} else {
			return false;
		}
	}

	//Format non-shortcode pre tags to be styled properly
	jQuery('pre.nebula-code').each(function(){
		if ( !jQuery(this).parent('.nebula-code-con').length ){
			lang = jQuery.trim(jQuery(this).attr('class').replace('nebula-code', ''));
			jQuery(this).addClass(lang.toLowerCase()).wrap('<div class="nebula-code-con clearfix ' + lang.toLowerCase() + '"></div>');
			jQuery(this).closest('.nebula-code-con').prepend('<span class="nebula-code codetitle ' + lang.toLowerCase() + '">' + lang + '</span>');
		}
	});

	jQuery('.nebula-code-con').each(function(){
		jQuery(this).append('<a href="#" class="nebula-selectcopy-code">' + selectCopyText + '</a>');
		jQuery(this).find('p:empty').remove();
	});

	nebula.dom.document.on('click touch tap', '.nebula-selectcopy-code', function(){
	    oThis = jQuery(this);

	    if ( jQuery(this).text() === 'Copy to clipboard' ){
		    selectText(jQuery(this).closest('.nebula-code-con').find('pre'), 'copy', function(success){
			    if ( success ){
				    oThis.text('Copied!').removeClass('error').addClass('success');
				    setTimeout(function(){
					    oThis.text('Copy to clipboard').removeClass('success');
				    }, 1500);
			    } else {
				    jQuery('.nebula-selectcopy-code').each(function(){
					    jQuery(this).text('Select All');
				    });
				    oThis.text('Unable to copy.').addClass('error');
				    setTimeout(function(){
					    oThis.text('Select All').removeClass('error');
				    }, 3500);
			    }
		    });
	    } else {
		    selectText(jQuery(this).closest('.nebula-code-con').find('pre'), function(success){
			    if ( success ){
				    oThis.text('Selected!').removeClass('error').addClass('success');
				    setTimeout(function(){
					    oThis.text('Select All').removeClass('success');
				    }, 1500);
			    } else {
				    jQuery('.nebula-selectcopy-code').each(function(){
					    jQuery(this).hide();
				    });
				    oThis.text('Unable to select.').addClass('error');
			    }
		    });
	    }
		return false;
	});
}

//Select (and optionally copy) text
function selectText(element, copy, callback){
	if ( typeof element === 'string' ){
		element = jQuery(element)[0];
	} else if ( typeof element === 'object' && element.nodeType !== 1 ){
		element = element[0];
	}

	if ( typeof copy === 'function' ){
		callback = copy;
		copy = null;
	}

	try {
		if ( document.body.createTextRange ){
			var range = document.body.createTextRange();
			range.moveToElementText(element);
			range.select();
			if ( !copy && callback ){
				callback(true);
				return false;
			}
		} else if ( window.getSelection ){
			var selection = window.getSelection();
			var range = document.createRange();
			range.selectNodeContents(element);
			selection.removeAllRanges();
			selection.addRange(range);
			if ( !copy && callback ){
				callback(true);
				return false;
			}
		}
	} catch(err){
		if ( callback ){
			callback(false);
			return false;
		}
	}

	if ( copy ){
		try {
			var success = document.execCommand('copy');
			if ( callback ){
				callback(success);
				return false;
			}
		} catch(err){
			if ( callback ){
				callback(false);
				return false;
			}
		}
	}

	if ( callback ){
		callback(false);
	}
	return false;
}

function copyText(string, callback){
	jQuery('<div>').attr('id', 'copydiv').text(string).css({'position': 'absolute', 'top': '0', 'left': '-9999px', 'width': '0', 'height': '0', 'opacity': '0', 'color': 'transparent'}).appendTo(jQuery('body'));
	selectText(jQuery('#copydiv'), true, callback);
	jQuery('#copydiv').remove();
	return false;
}

function chosenSelectOptions(){
	jQuery('.chosen-select').chosen({
		disable_search_threshold: 5,
		search_contains: true,
		no_results_text: "No results found.",
		allow_single_deselect: true,
		width: "100%"
	});
}

function dataTablesActions(){
	//DataTables search term highlighter. @TODO "Nebula" 0: Not quite ready... When highlighting, all other styling is removed.
/*
	nebula.dom.document.on('keyup', '.dataTables_wrapper .dataTables_filter input', function(){
		theSearchTerm = jQuery(this).val().replace(/(\s+)/,"(<[^>]+>)*$1(<[^>]+>)*");
		var pattern = new RegExp("(" + theSearchTerm + ")", "gi");
		if ( theSearchTerm.length ){
			jQuery('.dataTables_wrapper td').each(function(i){
				var searchFinder = jQuery(this).text().replace(new RegExp('(' + preg_quote(theSearchTerm) + ')', 'gi'), '<mark class="filterresultword">$1</mark>');
				jQuery(this).html(searchFinder);
			});
		} else {
			jQuery('.dataTables_wrapper td mark').each(function(){
				jQuery(this).contents().unwrap();
			});
		}
	});
*/
}

//Video Tracking
function nebulaVideoTracking(){
	if ( typeof players === 'undefined' ){
		players = {
			'html5': {},
			'youtube': {},
			'vimeo': {},
		};
		videoData = {};
	}

	nebulaHTML5VideoTracking();
	nebulaYoutubeTracking();
	nebulaVimeoTracking();
}

//Native HTML5 Video Tracking
function nebulaHTML5VideoTracking(){
	if ( jQuery('video:visible').length ){
		jQuery('video').each(function(){
			var oThis = jQuery(this);
			var id = oThis.attr('id');
			var videoTitle = oThis.attr('title') || oThis.attr('id') || false;

			if ( !videoTitle ){
				return false; //An ID or title is required to track HTML5 videos
			}

			players.html5[id] = oThis; //This is just for reference. It isn't used like it is for Youtube and Vimeo.

			if ( !videoData[id] ){
				videoData[id] = {
					'platform': 'html5', //The platform the video is hosted using.
					'player': id, //The player ID of this video. Can access the API here.
					'autoplay': false, //Will be overwritten if it is an autoplay video.
					'current': this.currentTime, //The current position of the video. Units: Seconds
					'duration': this.duration, //The total duration of the video. Units: Seconds
					'percent': 0, //The percent of the current position. Multiply by 100 for actual percent.
					'seeker': false, //Whether the viewer has seeked through the video at least once.
					'seen': [], //An array of percentages seen by the viewer. This is to roughly estimate how much was watched.
					'watched': 0, //Amount of time watching the video (regardless of seeking). Accurate to 1% of video duration. Units: Seconds
					'watchedPercent': 0, //The decimal percentage of the video watched. Multiply by 100 for actual percent.
					'pausedYet': false, //If this video has been paused yet by the user.
				};
			}

			oThis.on('play', function(){
				if ( 'mediaSession' in navigator && oThis.attr('title') ){
					navigator.mediaSession.metadata = new MediaMetadata({
						title: oThis.attr('title'),
						artist: oThis.attr('artist') || '',
						album: oThis.attr('album') || '',
/*
						artwork: [{
							src: 'https://dummyimage.com/512x512',
							sizes: '512x512',
							type: 'image/png'
						}]
*/
					});
				}

				playAction = 'Play';
				if ( !isInView(oThis) ){
					playAction += ' (Not In View)';
				}

				//Detect if has autoplay attribute
				if ( oThis.is('[autoplay]') ){
					videoData[id].autoplay = true;
					playAction += ' (Autoplay)';
				}

				ga('set', gaCustomMetrics['videoStarts'], 1);
		        ga('set', gaCustomDimensions['videoWatcher'], 'Started');
		        ga('send', 'event', 'Videos', playAction, videoTitle, Math.round(videoData[id].current), {'nonInteraction': videoData[id].autoplay});
		        if ( !videoData[id].autoplay ){
			        nv('append', {'video_play': videoTitle});
		        }
		        nebula.dom.document.trigger('nebula_playing_video', id);
			});

			oThis.on('timeupdate', function(){
				videoData[id].current = this.currentTime;
				videoData[id].percent = videoData[id].current*100/videoData[id].duration; //Determine watched percent by adding current percents to an array, then count the array!
				nowSeen = Math.ceil(videoData[id].percent);
				if ( videoData[id].seen.indexOf(nowSeen) < 0 ){
					videoData[id].seen.push(nowSeen);
				}

				videoData[id].watchedPercent = videoData[id].seen.length;
				videoData[id].watched = (videoData[id].seen.length/100)*videoData[id].duration; //Roughly calculate time watched based on percent seen

				if ( videoData[id].watchedPercent > 25 && !videoData[id].engaged ){
					if ( isInView(oThis) ){
						ga('set', gaCustomDimensions['videoWatcher'], 'Engaged');

						engagedAction = 'Engaged';
						if ( videoData[id].autoplay ){
							engagedAction += ' (Autoplay)';
						}

						ga('send', 'event', 'Videos', engagedAction, videoTitle, Math.round(videoData[id].current), {'nonInteraction': true});
						nv('append', {'video_engaged': videoTitle});
						videoData[id].engaged = true;
						nebula.dom.document.trigger('nebula_engaged_video', id);
					}
				}
			});

			oThis.on('pause', function(){
				ga('set', gaCustomDimensions['videoWatcher'], 'Paused');
				ga('set', gaCustomMetrics['videoPlaytime'], Math.round(videoData[id].watched));
				ga('set', gaCustomDimensions['videoPercentage'], Math.round(videoData[id].percent*100));

				if ( !videoData[id].pausedYet ){
					ga('send', 'event', 'Videos', 'First Pause', videoTitle, Math.round(videoData[id].current));
					videoData[id].pausedYet = true;
				}

				ga('send', 'event', 'Videos', 'Paused', videoTitle, Math.round(videoData[id].current));
				ga('send', 'timing', 'Videos', 'Paused', Math.round(videoData[id].current*1000), videoTitle);
				nv('append', {'video_paused': videoTitle});
				nebula.dom.document.trigger('nebula_paused_video', id);
			});

			oThis.on('seeked', function(){
				if ( videoData[id].current == 0 && oThis.is('[loop]') ){ //If the video is set to loop and is starting again
					//If it is an autoplay video without controls, don't log loops
					if ( oThis.is('[autoplay]') && !oThis.is('[controls]') ){
						return false;
					}

					endedAction = 'Ended (Looped)';
					if ( !isInView(oThis) ){
						endedAction += ' (Not In View)';
					}

					if ( videoData[id].autoplay ){
						endedAction += ' (Autoplay)';
					}

					ga('send', 'event', 'Videos', endedAction, videoTitle, {'nonInteraction': true});
				} else { //Otherwise, the user seeked
					debounce(function(){
						ga('set', gaCustomDimensions['videoWatcher'], 'Seeker');
						ga('send', 'event', 'Videos', 'Seek', videoTitle + ' [to: ' + videoData[id].current.toFixed(0) + ']');
						nv('append', {'video_seeked': videoTitle});
						videoData[id].seeker = true;
						nebula.dom.document.trigger('nebula_seeked_video', id);
					}, 250, 'video seeking')
				}
			});

			oThis.on('volumechange', function(){
				//console.debug(this);
			});

			oThis.on('ended', function(){
				ga('set', gaCustomMetrics['videoCompletions'], 1);
				ga('set', gaCustomMetrics['videoPlaytime'], Math.round(videoData[id].watched));
				ga('set', gaCustomDimensions['videoWatcher'], 'Ended');

				endedAction = 'Ended';
				if ( !isInView(oThis) ){
					endedAction += ' (Not In View)';
				}

				if ( videoData[id].autoplay ){
					endedAction += ' (Autoplay)';
				}

				ga('send', 'event', 'Videos', endedAction, videoTitle, Math.round(videoData[id].current), {'nonInteraction': true});

				ga('send', 'timing', 'Videos', 'Ended', Math.round(videoData[id].current*1000), videoTitle);
				nv('append', {'video_ended': videoTitle});
				nebula.dom.document.trigger('nebula_ended_video', id);
			});
		});
	}
}

//Check for Youtube videos
//@TODO "Nebula" 0: Add a console warning if Google API key is empty. Possibly in nebula_functions.php in video_meta()
function nebulaYoutubeTracking(){
	if ( jQuery('iframe[src*="youtube"]').length ){
		var tag = document.createElement('script');
		tag.src = "https://www.youtube.com/iframe_api";
		var firstScriptTag = document.getElementsByTagName('script')[0];
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
	}
}
function onYouTubeIframeAPIReady(e){
	jQuery('iframe[src*="youtube"]').each(function(i){
		var youtubeiframeID = jQuery(this).attr('id');
		if ( !youtubeiframeID ){
			youtubeiframeID = jQuery(this).attr('src').split('?')[0].split('/').pop();
			jQuery(this).attr('id', youtubeiframeID);
		}

		if ( jQuery(this).attr('src').indexOf('enablejsapi=1') > 0 ){
			players.youtube[youtubeiframeID] = new YT.Player(youtubeiframeID, { //YT.Player parameter must match the iframe ID!
				events: {
					'onReady': onPlayerReady,
					'onStateChange': onPlayerStateChange,
					'onError': onPlayerError
				}
			});

			nebula.dom.document.trigger('nebula_youtube_players_created');
		} else {
			console.warn('The enablejsapi parameter was not found for this Youtube iframe. It has been reloaded to enable it. For better optimization, add it to the iframe.');

			//JS API not enabled for this video. Reload the iframe with the correct parameter.
			jQuery(this).attr('src', jQuery(this).attr('src') + '&enablejsapi=1').on('load', function(){
				players.youtube[youtubeiframeID] = new YT.Player(youtubeiframeID, { //YT.Player parameter must match the iframe ID!
					events: {
						'onReady': onPlayerReady,
						'onStateChange': onPlayerStateChange,
						'onError': onPlayerError
					}
				});

				nebula.dom.document.trigger('nebula_youtube_players_created');
			});
		}
	});

	pauseFlag = false;
}
function onPlayerError(e){
	var videoInfo = e.target.getVideoData();
	ga('send', 'exception', {'exDescription': 'Youtube API error for ' + videoInfo.title + ': ' + e.data, 'exFatal': false});
	nv('append', {'js_errors': videoInfo.title + ' (Code: ' + e.data + ')'});
}
function onPlayerReady(e){
	if ( typeof videoProgress === 'undefined' ){
		videoProgress = {};
	}

	var videoInfo = e.target.getVideoData();
	videoData[videoInfo.video_id] = {
		'platform': 'youtube', //The platform the video is hosted using.
		'iframe': e.target.getIframe(), //The player iframe. Selectable with jQuery(videoData[id].iframe)...
		'player': players.youtube[videoInfo.video_id], //The player ID of this video. Can access the API here.
		'autoplay': jQuery(e.target.getIframe()).attr('src').indexOf('autoplay=1') > 0, //Look for the autoplay parameter in the ifrom src.
		'duration': e.target.getDuration(), //The total duration of the video. Unit: Seconds
		'current': e.target.getCurrentTime(), //The current position of the video. Units: Seconds
		'percent': e.target.getCurrentTime()/e.target.getDuration(), //The percent of the current position. Multiply by 100 for actual percent.
		'engaged': false, //Whether the viewer has watched enough of the video to be considered engaged.
		'watched': 0, //Amount of time watching the video (regardless of seeking). Accurate to half a second. Units: Seconds
		'watchedPercent': 0, //The decimal percentage of the video watched. Multiply by 100 for actual percent.
		'pausedYet': false, //If this video has been paused yet by the user.
	};
}
function onPlayerStateChange(e){
	var videoInfo = e.target.getVideoData();
	var id = videoInfo.video_id;

	videoData[id].current = e.target.getCurrentTime();
	videoData[id].percent = videoData[id].current/videoData[id].duration;

    if ( e.data === YT.PlayerState.PLAYING ){
	    ga('set', gaCustomMetrics['videoStarts'], 1);
        ga('set', gaCustomDimensions['videoWatcher'], 'Started');

        playAction = 'Play';
		if ( !isInView(jQuery(videoData[id].iframe)) ){
			playAction += ' (Not In View)';
		}

		if ( videoData[id].autoplay ){
			playAction += ' (Autoplay)';
		}

        ga('send', 'event', 'Videos', playAction, videoInfo.title, Math.round(videoData[id].current));

        nv('append', {'video_play': videoInfo.title});
        nebula.dom.document.trigger('nebula_playing_video', videoInfo);
        pauseFlag = true;
		updateInterval = 500;

		youtubePlayProgress = setInterval(function(){
			videoData[id].current = e.target.getCurrentTime();
			videoData[id].percent = videoInfo.currentTime/videoData[id].duration;
			videoData[id].watched = videoData[id].watched+(updateInterval/1000);
			videoData[id].watchedPercent = (videoData[id].watched)/videoData[id].duration;

			if ( videoData[id].watchedPercent > 0.25 && !videoData[id].engaged ){
				if ( isInView(jQuery(videoData[id].iframe)) ){
					ga('set', gaCustomDimensions['videoWatcher'], 'Engaged');

					engagedAction = 'Engaged';
					if ( videoData[id].autoplay ){
						engagedAction += ' (Autoplay)';
					}
					ga('send', 'event', 'Videos', engagedAction, videoInfo.title, Math.round(videoData[id].current), {'nonInteraction': true});

					nv('append', {'video_engaged': videoInfo.title});
					videoData[id].engaged = true;
					nebula.dom.document.trigger('nebula_engaged_video', videoInfo);
				}
			}
		}, updateInterval);
    }
    if ( e.data === YT.PlayerState.ENDED ){
        clearInterval(youtubePlayProgress);
        ga('set', gaCustomMetrics['videoCompletions'], 1);
        ga('set', gaCustomMetrics['videoPlaytime'], Math.round(videoData[id].watched/1000));
        ga('set', gaCustomDimensions['videoWatcher'], 'Ended');

        endedAction = 'Ended';
		if ( !isInView(jQuery(videoData[id].iframe)) ){
			endedAction += ' (Not In View)';
		}

		if ( videoData[id].autoplay ){
			endedAction += ' (Autoplay)';
		}

        ga('send', 'event', 'Videos', endedAction, videoInfo.title, Math.round(videoData[id].current), {'nonInteraction': true});
        ga('send', 'timing', 'Videos', 'Ended', videoData[id].current*1000, videoInfo.title);
        nv('append', {'video_ended': videoInfo.title});
        nebula.dom.document.trigger('nebula_ended_video', videoInfo);
    } else if ( e.data === YT.PlayerState.PAUSED && pauseFlag ){
        clearInterval(youtubePlayProgress);
        ga('set', gaCustomMetrics['videoPlaytime'], Math.round(videoData[id].watched));
        ga('set', gaCustomDimensions['videoPercentage'], Math.round(videoData[id].percent*100));
        ga('set', gaCustomDimensions['videoWatcher'], 'Paused');

		if ( !videoData[id].pausedYet ){
			ga('send', 'event', 'Videos', 'First Pause', videoInfo.title, Math.round(videoData[id].current));
			videoData[id].pausedYet = true;
		}

        ga('send', 'event', 'Videos', 'Paused', videoInfo.title, Math.round(videoData[id].current));
        ga('send', 'timing', 'Videos', 'Paused', videoData[id].current*1000, videoInfo.title);
        nv('append', {'video_paused': videoInfo.title});
        nebula.dom.document.trigger('nebula_paused_video', videoInfo);
        pauseFlag = false;
    }
}

function nebulaVimeoTracking(){
	//Load the Vimeo API script (player.js) remotely (with local backup)
	if ( jQuery('iframe[src*="vimeo"]').length ){
        jQuery.getScript(nebula.site.resources.js.vimeo).done(function(){
			createVimeoPlayers();
		}).fail(function(){
			ga('send', 'exception', {'exDescription': 'Vimeo player.js could not be loaded', 'exFatal': false});
			nv('append', {'js_errors': 'Vimeo player.js (remote) could not be loaded'});
		});
	}

	//To trigger events on these videos, use the syntax: players['PHG-Overview-Video'].api("play");
	function createVimeoPlayers(){
	    jQuery('iframe[src*="vimeo"]').each(function(i){
			var vimeoiframeID = jQuery(this).attr('id');
			if ( !vimeoiframeID ){
				vimeoiframeID = jQuery(this).attr('src').split('player_id=').pop().split('&')[0];
				jQuery(this).attr('id', vimeoiframeID);
			}

			players.vimeo[vimeoiframeID] = new Vimeo.Player(jQuery(this));
			players.vimeo[vimeoiframeID].on('loaded', vimeoReady);
		    players.vimeo[vimeoiframeID].on('play', vimeoPlay);
		    players.vimeo[vimeoiframeID].on('timeupdate', vimeoTimeUpdate);
		    players.vimeo[vimeoiframeID].on('pause', vimeoPause);
		    players.vimeo[vimeoiframeID].on('seeked', vimeoSeeked);
		    players.vimeo[vimeoiframeID].on('ended', vimeoEnded);

		    nebula.dom.document.trigger('nebula_vimeo_players_created', vimeoiframeID);
		});

		if ( typeof videoProgress === 'undefined' ){
			videoProgress = {};
		}
	}

	function vimeoReady(data){
		videoData[data.id] = {
			'platform': 'vimeo', //The platform the video is hosted using.
			'player': players.vimeo[data.id], //The player ID of this video. Can access the API here.
			'autoplay': jQuery(players.vimeo[data.id].element).attr('src').indexOf('autoplay=1') > 0, //Look for the autoplay parameter in the ifrom src.
			'current': 0, //The current position of the video. Units: Seconds
			'percent': 0, //The percent of the current position. Multiply by 100 for actual percent.
			'engaged': false, //Whether the viewer has watched enough of the video to be considered engaged.
			'seeker': false, //Whether the viewer has seeked through the video at least once.
			'seen': [], //An array of percentages seen by the viewer. This is to roughly estimate how much was watched.
			'watched': 0, //Amount of time watching the video (regardless of seeking). Accurate to 1% of video duration. Units: Seconds
			'watchedPercent': 0, //The decimal percentage of the video watched. Multiply by 100 for actual percent.
			'pausedYet': false, //If this video has been paused yet by the user.
		};

		//Duration
		players.vimeo[data.id].getDuration().then(function(duration){
			videoData[data.id].duration = duration; //The total duration of the video. Units: Seconds
		});

		//Title
		players.vimeo[data.id].getVideoTitle().then(function(title){
			videoData[data.id].title = title; //The title of the video
		});
	}

	function vimeoPlay(data){
		var id = jQuery(this.element).attr('id');
	    var videoTitle = videoData[id].title;
	    ga('set', gaCustomMetrics['videoStarts'], 1);
	    ga('set', gaCustomDimensions['videoWatcher'], 'Started');

	    playAction = 'Play';
		if ( !isInView(jQuery(this)) ){
			playAction += ' (Not In View)';
		}

		if ( jQuery(this).attr('src').indexOf('autoplay=1') > 0 ){
			playAction += ' (Autoplay)';
		}

	    ga('send', 'event', 'Videos', playAction, videoTitle, Math.round(data.seconds));
	    nv('append', {'video_play': videoTitle});
	    nebula.dom.document.trigger('nebula_playing_video', id);
	}

	function vimeoTimeUpdate(data){
		var id = jQuery(this.element).attr('id');
	    var videoTitle = videoData[id].title;

		videoData[id].duration = data.duration;
		videoData[id].current = data.seconds;
		videoData[id].percent = data.percent;

		//Determine watched percent by adding current percents to an array, then count the array!
		nowSeen = Math.ceil(data.percent*100);
		if ( videoData[id].seen.indexOf(nowSeen) < 0 ){
			videoData[id].seen.push(nowSeen);
		}
		videoData[id].watchedPercent = videoData[id].seen.length;
		videoData[id].watched = (videoData[id].seen.length/100)*videoData[id].duration; //Roughly calculate time watched based on percent seen

		if ( videoData[id].watchedPercent > 25 && !videoData[id].engaged ){
			if ( isInView(jQuery(this.element)) ){
				ga('set', gaCustomDimensions['videoWatcher'], 'Engaged');

				engagedAction = 'Engaged';
				if ( videoData[id].autoplay ){
					engagedAction += ' (Autoplay)';
				}
				ga('send', 'event', 'Videos', engagedAction, videoTitle, Math.round(data.seconds), {'nonInteraction': true});

				nv('append', {'video_engaged': videoTitle});
				videoData[id].engaged = true;
				nebula.dom.document.trigger('nebula_engaged_video', id);
			}
		}
	}

	function vimeoPause(data){
		var id = jQuery(this.element).attr('id');
		var videoTitle = videoData[id].title;
		ga('set', gaCustomDimensions['videoWatcher'], 'Paused');
		ga('set', gaCustomMetrics['videoPlaytime'], Math.round(videoData[id].watched));
		ga('set', gaCustomDimensions['videoPercentage'], Math.round(data.percent*100));

		if ( !videoData[id].pausedYet && !videoData[id].seeker ){ //Only capture first pause if they didn't seek
			ga('send', 'event', 'Videos', 'First Pause', videoTitle, Math.round(data.seconds));
			videoData[id].pausedYet = true;
		}

		ga('send', 'event', 'Videos', 'Paused', videoTitle, Math.round(data.seconds));
		ga('send', 'timing', 'Videos', 'Paused', Math.round(data.seconds*1000), videoTitle);
		nv('append', {'video_paused': videoTitle});
		nebula.dom.document.trigger('nebula_paused_video', id);
	}

	function vimeoSeeked(data){
	    var id = jQuery(this.element).attr('id');
		var videoTitle = videoData[id].title;
	    ga('set', gaCustomDimensions['videoWatcher'], 'Seeker');
	    ga('send', 'event', 'Videos', 'Seek', videoTitle + ' [to: ' + data.seconds + ']');
	    nv('append', {'video_seeked': videoTitle});
	    videoData[id].seeker = true;
	    nebula.dom.document.trigger('nebula_seeked_video', id);
	}

	function vimeoEnded(data){
		var id = jQuery(this.element).attr('id');
		var videoTitle = videoData[id].title;
		ga('set', gaCustomMetrics['videoCompletions'], 1);
		ga('set', gaCustomMetrics['videoPlaytime'], Math.round(videoData[id].watched));
		ga('set', gaCustomDimensions['videoWatcher'], 'Ended');

		endedAction = 'Ended';
		if ( !isInView(jQuery(this.element)) ){
			endedAction += ' (Not In View)';
		}

		if ( videoData[id].autoplay ){
			endedAction += ' (Autoplay)';
		}

		ga('send', 'event', 'Videos', endedAction, videoTitle, Math.round(data.seconds), {'nonInteraction': true});
		ga('send', 'timing', 'Videos', 'Ended', Math.round(videoData[id].watched*1000), videoTitle); //Roughly amount of time watched (Can not be over 100% for Vimeo)
		nv('append', {'video_ended': videoTitle});
		nebula.dom.document.trigger('nebula_ended_video', id);
	}
}

//Pause all videos
//Use class "ignore-visibility" on iframes to allow specific videos to continue playing regardless of page visibility
//Pass force as true to pause no matter what.
function pauseAllVideos(force){
	if ( typeof players === 'undefined' ){
		return false; //If videos don't exist, then no need to pause
	}

	if ( typeof force === 'null' ){
		force = false;
	}

	//Pause HTML5 Videos
	jQuery('video').each(function(){
		if ( (force || !jQuery(this).hasClass('ignore-visibility')) ){
			jQuery(this)[0].pause();
		}
	});

	//Pause Youtube Videos
	jQuery('iframe.youtube').each(function(){
		youtubeiframeID = jQuery(this).attr('id');
		if ( !(youtubeiframeID in players.youtube) ){
			return false;
		}

		if ( (force || !jQuery(this).hasClass('ignore-visibility')) && typeof players.youtube[youtubeiframeID].pauseVideo === 'function' ){
			players.youtube[youtubeiframeID].pauseVideo();
		}
	});

	//Pause Vimeo Videos
	jQuery('iframe.vimeo').each(function(){
		vimeoiframeID = jQuery(this).attr('id');
		if ( !(vimeoiframeID in players.vimeo) ){
			return false;
		}

		if ( (force || !jQuery(this).hasClass('ignore-visibility')) && typeof players.vimeo[vimeoiframeID].pause === 'function' ){
			players.vimeo[vimeoiframeID].pause();
		}
	});
}

//Create desktop notifications
function desktopNotification(title, message, clickCallback, showCallback, closeCallback, errorCallback){
	if ( checkNotificationPermission() ){
		//Set defaults
		var defaults = {
			dir: "auto", //Direction ["auto", "ltr", "rtl"] (optional)
			lang: "en-US", //Language (optional)
			body: "", //Body message (optional)
			tag: Math.floor(Math.random()*10000)+1, //Unique tag for notification. Prevents repeat notifications of the same tag. (optional)
			icon: nebula.site.directory.template.uri + "/assets/img/meta/favicon-160x160.png" //Thumbnail Icon (optional)
		}

		if ( typeof message === "undefined" ){
			message = defaults;
		} else if ( typeof message === "string" ){
			body = message;
			message = defaults;
			message.body = body;
		} else {
			if ( typeof message.dir === "undefined" ){
				message.dir = defaults.dir;
			}
			if ( typeof message.lang === "undefined" ){
				message.lang = defaults.lang;
			}
			if ( typeof message.body === "undefined" ){
				message.body = defaults.lang;
			}
			if ( typeof message.tag === "undefined" ){
				message.tag = defaults.tag;
			}
			if ( typeof message.icon === "undefined" ){
				message.icon = defaults.icon;
			}
		}

		instance = new Notification(title, message); //Trigger the notification //@TODO "Nebula" 0: This will be deprecated soon. Update to the service worker.

		if ( clickCallback ){
			instance.onclick = function(){
				clickCallback();
			};
		}
		if ( showCallback ){
            instance.onshow = function(e){
                showCallback();
            };
        } else {
            instance.onshow = function(e){
                setTimeout(function(){
                    instance.close();
                }, 20000);
            }
        }
		if ( closeCallback ){
			instance.onclose = function(){
				closeCallback();
			};
		}
		if ( errorCallback ){
			instance.onerror = function(){
				ga('send', 'exception', {'exDescription': 'Desktop Notification error', 'exFatal': false});
				errorCallback();
			};
		}
	}
	return false;
}

function checkNotificationPermission(){
	Notification = window.Notification || window.mozNotification || window.webkitNotification;
	if ( !(Notification) ){
		return false;
	} else if ( Notification.permission === "granted" ){
		return true;
	} else if ( Notification.permission !== 'denied' ){
		Notification.requestPermission(function (permission){
			if( !('permission' in Notification) ){
				Notification.permission = permission;
			}
			if ( permission === "granted" ){
				return true;
			}
		});
	}
	return false;
}

function nebulaVibrate(pattern){
	if ( typeof pattern !== 'object' ){
		pattern = [100, 200, 100, 100, 75, 25, 100, 200, 100, 500, 100, 200, 100, 500];
	}
	if ( navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate ){
		navigator.vibrate(pattern);
	}
	return false;
}

function moreEvents(bool){
	if ( !bool ){
		jQuery('#load-more-events').addClass('all-events-loaded');
	} else {
		jQuery('#load-more-events').removeClass('all-events-loaded');
	}
}

//Show/Hide the reset button
function eventFormNeedReset(){
	hasValue = false;

	//Check the category select dropdown
/*
	jQuery('#advanced-search-form select').each(function(){
		if ( jQuery(this).find('option:selected').val() && jQuery(this).find('option:selected').val() != '' ){
			jQuery('.resetfilters').addClass('active');
			hasValue = true;
			return false;
		}
	});
*/

	//@TODO "Nebula" 0: This is not disappearing when reset link itself is clicked.
	//Check all other inputs
	jQuery('#advanced-search-form input').each(function(){
		if ( (jQuery(this).attr('type') !== 'checkbox' && jQuery(this).val() !== '') || jQuery(this).prop("checked") ){
			jQuery('.resetfilters').addClass('active');
			hasValue = true;
			return false;
		}
	});

	if ( !hasValue ){
		jQuery('.resetfilters').removeClass('active');
	}
}

function mmenus(){
	if ( 'mmenu' in jQuery ){
		var mobileNav = jQuery('#mobilenav');
		var mobileNavTriggerIcon = jQuery('a.mobilenavtrigger i');

		if ( mobileNav.length ){
			mobileNav.mmenu({
				//Options
				offCanvas: {
				    position: "left", //"left" (default), "right", "top", "bottom"
				    zposition: "back", //"back" (default), "front", "next"
			    },
				navbars: [{
					position: "top",
					content: ["searchfield"]
				}, {
					position: "bottom",
					content: ["<span>" + nebula.site.name + "</span>"]
				}],
				searchfield: {
			    	add: true,
			    	search: true,
			    	placeholder: 'Search',
			    	noResults: "No navigation items found.",
			    	showSubPanels: false,
			    	showTextItems: false,
			    	resultsPanel: true,
			    },
			    counters: true, //Display count of sub-menus
			    iconPanels: false, //Layer panels on top of each other
			    extensions: ["theme-light", "effect-slide-menu", "pageshadow"] //Theming, effects, and other extensions
			}, {
				//Configuration
				offCanvas: {
					pageSelector: "#body-wrapper"
				},
				classNames: {
					selected: "current-menu-item"
				},
				searchfield: {
					clear: true,
					form: {
						method: "get",
						action: nebula.site.home_url,
					},
					input: {
						name: "s",
					}
				}
			});

			if ( mobileNav.length ){
				mobileNav.data('mmenu').bind('opening', function(){
					//When mmenu has started opening
					mobileNavTriggerIcon.removeClass('fa-bars').addClass('fa-times').closest('.mobilenavtrigger').addClass('active');
					nebulaTimer('mmenu', 'start');
				}).bind('opened', function(){
					//After mmenu has finished opening
					history.replaceState(null, document.title, location);
					history.pushState(null, document.title, location);
				}).bind('closing', function(){
					//When mmenu has started closing
					mobileNavTriggerIcon.removeClass('fa-times').addClass('fa-bars').closest('.mobilenavtrigger').removeClass('active');
					ga('send', 'timing', 'Mmenu', 'Closed', Math.round(nebulaTimer('mmenu', 'lap')), 'From opening mmenu until closing mmenu');
				}).bind('closed', function(){
					//After mmenu has finished closing
				});
			}

			nebula.dom.document.on('click tap touch', '.mm-menu li a:not(.mm-next)', function(){
				ga('send', 'timing', 'Mmenu', 'Navigated', Math.round(nebulaTimer('mmenu', 'lap')), 'From opening mmenu until navigation');
			});

			//Close mmenu on back button click
			if ( window.history && window.history.pushState ){
				window.addEventListener("popstate", function(e){
					if ( jQuery('html.mm-opened').length ){
						mobileNav.data('mmenu').close();
						e.stopPropagation();
					}
				}, false);
			}
		}
	}
}

//Vertical subnav expanders
function subnavExpanders(){
    jQuery('.xoxo .menu li.menu-item:has(ul)').addClass('has-expander').append('<a class="toplevelvert_expander closed" href="#"><i class="fa fa-caret-left"></i></a>');
    jQuery('.toplevelvert_expander').parent().children('.sub-menu').hide();
    nebula.dom.document.on('click touch tap', '.toplevelvert_expander', function(){
        jQuery(this).toggleClass('closed open').parent().children('.sub-menu').slideToggle();
        return false;
    });
    //Automatically expand subnav to show current page
    jQuery('.current-menu-ancestor').children('.toplevelvert_expander').click();
    jQuery('.current-menu-item').children('.toplevelvert_expander').click();
}

/*==========================
 Extension Functions
 ===========================*/

//Custom CSS expression for a case-insensitive contains(). Source: https://css-tricks.com/snippets/jquery/make-jquery-contains-case-insensitive/
//Call it with :Contains() - Ex: ...find("*:Contains(" + jQuery('.something').val() + ")")... -or- use the nebula function: keywordSearch(container, parent, value);
jQuery.expr[":"].Contains=function(e,n,t){return(e.textContent||e.innerText||"").toUpperCase().indexOf(t[3].toUpperCase())>=0};

//Escape required characters from a provided string. https://github.com/kvz/locutus
function preg_quote(str, delimiter){return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');}

//Parse dates (equivalent of PHP function). https://github.com/kvz/locutus
function strtotime(e,t){function a(e,t,a){var n,r=c[t];"undefined"!=typeof r&&(n=r-w.getDay(),0===n?n=7*a:n>0&&"last"===e?n-=7:0>n&&"next"===e&&(n+=7),w.setDate(w.getDate()+n))}function n(e){var t=e.split(" "),n=t[0],r=t[1].substring(0,3),s=/\d+/.test(n),u="ago"===t[2],i=("last"===n?-1:1)*(u?-1:1);if(s&&(i*=parseInt(n,10)),o.hasOwnProperty(r)&&!t[1].match(/^mon(day|\.)?$/i))return w["set"+o[r]](w["get"+o[r]]()+i);if("wee"===r)return w.setDate(w.getDate()+7*i);if("next"===n||"last"===n)a(n,r,i);else if(!s)return!1;return!0}var r,s,u,i,w,c,o,d,D,f,g,l=!1;if(!e)return l;if(e=e.replace(/^\s+|\s+$/g,"").replace(/\s{2,}/g," ").replace(/[\t\r\n]/g,"").toLowerCase(),s=e.match(/^(\d{1,4})([\-\.\/\:])(\d{1,2})([\-\.\/\:])(\d{1,4})(?:\s(\d{1,2}):(\d{2})?:?(\d{2})?)?(?:\s([A-Z]+)?)?$/),s&&s[2]===s[4])if(s[1]>1901)switch(s[2]){case"-":return s[3]>12||s[5]>31?l:new Date(s[1],parseInt(s[3],10)-1,s[5],s[6]||0,s[7]||0,s[8]||0,s[9]||0)/1e3;case".":return l;case"/":return s[3]>12||s[5]>31?l:new Date(s[1],parseInt(s[3],10)-1,s[5],s[6]||0,s[7]||0,s[8]||0,s[9]||0)/1e3}else if(s[5]>1901)switch(s[2]){case"-":return s[3]>12||s[1]>31?l:new Date(s[5],parseInt(s[3],10)-1,s[1],s[6]||0,s[7]||0,s[8]||0,s[9]||0)/1e3;case".":return s[3]>12||s[1]>31?l:new Date(s[5],parseInt(s[3],10)-1,s[1],s[6]||0,s[7]||0,s[8]||0,s[9]||0)/1e3;case"/":return s[1]>12||s[3]>31?l:new Date(s[5],parseInt(s[1],10)-1,s[3],s[6]||0,s[7]||0,s[8]||0,s[9]||0)/1e3}else switch(s[2]){case"-":return s[3]>12||s[5]>31||s[1]<70&&s[1]>38?l:(i=s[1]>=0&&s[1]<=38?+s[1]+2e3:s[1],new Date(i,parseInt(s[3],10)-1,s[5],s[6]||0,s[7]||0,s[8]||0,s[9]||0)/1e3);case".":return s[5]>=70?s[3]>12||s[1]>31?l:new Date(s[5],parseInt(s[3],10)-1,s[1],s[6]||0,s[7]||0,s[8]||0,s[9]||0)/1e3:s[5]<60&&!s[6]?s[1]>23||s[3]>59?l:(u=new Date,new Date(u.getFullYear(),u.getMonth(),u.getDate(),s[1]||0,s[3]||0,s[5]||0,s[9]||0)/1e3):l;case"/":return s[1]>12||s[3]>31||s[5]<70&&s[5]>38?l:(i=s[5]>=0&&s[5]<=38?+s[5]+2e3:s[5],new Date(i,parseInt(s[1],10)-1,s[3],s[6]||0,s[7]||0,s[8]||0,s[9]||0)/1e3);case":":return s[1]>23||s[3]>59||s[5]>59?l:(u=new Date,new Date(u.getFullYear(),u.getMonth(),u.getDate(),s[1]||0,s[3]||0,s[5]||0)/1e3)}if("now"===e)return null===t||isNaN(t)?(new Date).getTime()/1e3|0:0|t;if(!isNaN(r=Date.parse(e)))return r/1e3|0;if(w=t?new Date(1e3*t):new Date,c={sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6},o={yea:"FullYear",mon:"Month",day:"Date",hou:"Hours",min:"Minutes",sec:"Seconds"},D="(years?|months?|weeks?|days?|hours?|minutes?|min|seconds?|sec|sunday|sun\\.?|monday|mon\\.?|tuesday|tue\\.?|wednesday|wed\\.?|thursday|thu\\.?|friday|fri\\.?|saturday|sat\\.?)",f="([+-]?\\d+\\s"+D+"|(last|next)\\s"+D+")(\\sago)?",s=e.match(new RegExp(f,"gi")),!s)return l;for(g=0,d=s.length;d>g;g++)if(!n(s[g]))return l;return w.getTime()/1e3}
