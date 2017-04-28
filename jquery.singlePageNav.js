/**
 * Single Page Nav Plugin
 * Copyright (c) 2014 Chris Wojcik <cpw1485@gmail.com>
 * Dual licensed under MIT and GPL.
 * @author Chris Wojcik
 * @version 1.2.1
 */

// Utility
if (typeof Object.create !== 'function') {
    Object.create = function(obj) {
        function F() {}
        F.prototype = obj;
        return new F();
    };
}

(function($, window, document, undefined) {
    "use strict";

    var SinglePageNav = {

        init: function(options, container) {

            this.options = $.extend({}, $.fn.singlePageNav.defaults, options);

            this.container = container;
            this.$container = $(container);
            this.$links = this.$container.find('a');

            if (this.options.filter !== '') {
                this.$links = this.$links.filter(this.options.filter);
            }
            this.$links.addClass(this.options.linkClass);

            this.$window = $(window);
            this.$htmlbody = $('html, body');

            this.$links.on('click.singlePageNav', $.proxy(this.handleClick, this));

            this.didScroll = false;
            this.checkPosition();
            this.setTimer();
        },

        handleClick: function(e) {
            var self  = this,
                link  = e.currentTarget,
                $elem = $(link.hash);

            e.preventDefault();

            if ($elem.length) { // Make sure the target elem exists

                // Prevent active link from cycling during the scroll
                self.clearTimer();

                // Before scrolling starts
                if (typeof self.options.beforeStart === 'function') {
                    self.options.beforeStart();
                }

                self.setActiveLink(link.hash);

                self.scrollTo($elem, function() {

                    if (self.options.updateHash && history.pushState) {
                        history.pushState(null,null, link.hash);
                    }

                    self.setTimer();

                    // After scrolling ends
                    if (typeof self.options.onComplete === 'function') {
                        self.options.onComplete();
                    }
                });
            }
        },

        scrollTo: function($elem, callback) {
            var self = this;
            var target = self.getCoords($elem).top;
            var called = false;

            self.$htmlbody.stop().animate(
                {scrollTop: target},
                {
                    duration: self.options.speed,
                    easing: self.options.easing,
                    complete: function() {
                        if (typeof callback === 'function' && !called) {
                            callback();
                        }
                        called = true;
                    }
                }
            );
        },

        setTimer: function() {
            var self = this;

            self.$window.on('scroll.singlePageNav', function() {
                self.didScroll = true;
            });

            self.timer = setInterval(function() {
                if (self.didScroll) {
                    self.didScroll = false;
                    self.checkPosition();
                }
            }, 250);
        },

        clearTimer: function() {
            clearInterval(this.timer);
            this.$window.off('scroll.singlePageNav');
            this.didScroll = false;
        },

        // Check the scroll position and set the active section
        checkPosition: function() {
            var scrollPos = this.$window.scrollTop();
            var currentSection = this.getCurrentSection(scrollPos);
            if(currentSection!==null) {
                this.setActiveLink(currentSection);
            }
        },

        getCoords: function($elem) {
            return {
                top: Math.round($elem.offset().top) - this.options.offset
            };
        },

        setActiveLink: function(href) {
            var $activeLinks = $("a." + this.options.linkClass + "[href$='" + href + "']");
            var $links = $("a." + this.options.linkClass);

            if (!$activeLinks.hasClass(this.options.currentClass)) {
                $links.removeClass(this.options.currentClass);
                $activeLinks.addClass(this.options.currentClass);
            }
        },

        getHashes: function () {
            var self = this,
                $links = $("a." + this.options.linkClass),
                hashes = [];

            $links.each(function() {
                if (hashes.indexOf(this.hash) === -1 && $(this.hash).length) {
                    hashes.push(this.hash);
                }
            });

            // Sort hashes by page position, from top to bottom
            hashes.sort(function(a, b) {
                var aCoords = self.getCoords($(a)),
                    bCoords = self.getCoords($(b));

                return aCoords.top - bCoords.top;
            });

            return hashes;
        },

        getCurrentSection: function(scrollPos) {
            var i, hash, coords, section,
                hashes = this.getHashes();

            for (i = 0; i < hashes.length; i++) {
                hash = hashes[i];

                coords = this.getCoords($(hash));

                if (scrollPos >= coords.top - this.options.threshold) {
                    section = hash;
                }
            }

            // get the last section if we reached the bottom of the page
            // before reaching the last section top
            var pageBottom = $(document).height() - $(window).height();
            if ( scrollPos == pageBottom ){
                var numberOfLinks = hashes.length;
                if ( numberOfLinks > 0 ){
                    section = hashes[ numberOfLinks - 1];
                }
            }

            // The current section or the first link if it is found
            return section || ((hashes.length===0) ? (null) : (hashes[0]));
        }
    };

    $.fn.singlePageNav = function(options) {
        return this.each(function() {
            var singlePageNav = Object.create(SinglePageNav);
            singlePageNav.init(options, this);
        });
    };

    $.fn.singlePageNav.defaults = {
        offset: 0,
        threshold: 120,
        speed: 400,
        currentClass: 'current',
        linkClass: 'singlePageNavLink',
        easing: 'swing',
        updateHash: false,
        filter: '',
        onComplete: false,
        beforeStart: false
    };

})(jQuery, window, document);
