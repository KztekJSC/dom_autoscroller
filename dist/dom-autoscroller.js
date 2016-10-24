(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.autoScroll = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var createPointCB = require('create-point-cb');

/*
git remote add origin https://github.com/hollowdoor/dom_autoscroller.git
git push -u origin master
*/

var requestFrame = (function(){
    if(requestAnimationFrame){
        return requestAnimationFrame;
    }else{
        return function(fn){
            return setTimeout(fn);
        };
    }
}());

var cancelFrame = (function(){
    if(cancelAnimationFrame){
        return cancelAnimationFrame;
    }else{
        return clearTimeout;
    }
}());

function AutoScroller(elements, options){
    var self = this, maxSpeed = 4;
    options = options || {};

    this.margin = options.margin || -1;
    this.scrolling = false;
    this.scrollWhenOutside = options.scrollWhenOutside || false;

    var point = {}, pointCB = createPointCB(point), down = false;

    window.addEventListener('mousemove', pointCB, false);
    window.addEventListener('touchmove', pointCB, false);

    if(!isNaN(options.maxSpeed)){
        maxSpeed = options.maxSpeed;
    }

    if(typeof options.autoScroll === 'boolean'){
        this.autoScroll = options.autoScroll ? function(){return true;} : function(){return false;};
    }else if(typeof options.autoScroll === 'undefined'){
        this.autoScroll = function(){return false;};
    }else if(typeof options.autoScroll === 'function'){
        this.autoScroll = options.autoScroll;
    }

    this.destroy = function() {
        window.removeEventListener('mousemove', pointCB, false);
        window.removeEventListener('touchmove', pointCB, false);
        window.removeEventListener('mousedown', onDown, false);
        window.removeEventListener('touchstart', onDown, false);
        window.removeEventListener('mouseup', onUp, false);
        window.removeEventListener('touchend', onUp, false);
        elements = [];
    };

    function getElement(element){
        if(typeof element === 'string'){
            return document.querySelector(element);
        }
        return element;
    }

    this.add = function(element){
        element = getElement(element);

        for(var i=0; i<elements.length; i++){
            if(elements[i] === element) return this;
        }

        elements.push(element);
        return this;
    };

    this.remove = function(element){
        element = getElement(element);

        for(var i=0; i<elements.length; i++){
            if(element === elements[i]){
                elements.splice(i, 1);
                return this;
            }
        }
        return this;
    };

    var hasWindow = null;

    (function(temp){
        elements = [];
        temp.forEach(function(element){
            if(element === window){
                hasWindow = window;
            }else{
                self.add(element);
            }
        })
    }(elements));

    Object.defineProperties(this, {
        down: {
            get: function(){ return down; }
        },
        maxSpeed: {
            get: function(){ return maxSpeed; }
        }
    });

    var n = 0, current, animationFrame, started = false;

    window.addEventListener('mousedown', onDown, false);
    window.addEventListener('touchstart', onDown, false);
    window.addEventListener('mouseup', onUp, false);
    window.addEventListener('touchend', onUp, false);

    window.addEventListener('mousemove', onMove, false);
    window.addEventListener('touchmove', onMove, false);

    function onDown(){
        down = true;
    }

    function onUp(){
        down = false;
        started = false;
        cancelFrame(animationFrame);
    }

    function onMove(event){

        if(!self.autoScroll()) return;
        if(!event.target) return;
        var target = event.target, last;

        if(!current || !inside(point, current) && !self.scrollWhenOutside){
            if(!current && target){
                current = null;
                while(target = target.parentNode){
                    for(var i=0; i<elements.length; i++){
                        if(elements[i] === target && inside(point, elements[i])){
                            current = elements[i];
                            break;
                        }
                    }
                }
            }else{
                last = current;
                current = null;
                for(var i=0; i<elements.length; i++){
                    if(elements[i] !== last && inside(point, elements[i])){
                        current = elements[i];
                    }
                }
            }
        }

        cancelFrame(animationFrame);
        animationFrame = requestFrame(scrollTick);
    }

    function scrollTick(){
        if(hasWindow){
            autoScroll(hasWindow);
        }

        if(!current){
            return;
        }

        autoScroll(current);

        cancelFrame(animationFrame);
        animationFrame = requestFrame(scrollTick);

    }

    function autoScroll(el){
        var rect = getRect(el), scrollx, scrolly;

        if(point.x < rect.left + self.margin){
            scrollx = Math.max(-1, (point.x - rect.left) / self.margin - 1) * self.maxSpeed;
        }else if(point.x > rect.right - self.margin){
            scrollx = Math.min(1, (point.x - rect.right) / self.margin + 1) * self.maxSpeed;
        }else{
            scrollx = 0;
        }

        if(point.y < rect.top + self.margin){
            scrolly = Math.max(-1, (point.y - rect.top) / self.margin - 1) * self.maxSpeed;
        }else if(point.y > rect.bottom - self.margin){
            scrolly = Math.min(1, (point.y - rect.bottom) / self.margin + 1) * self.maxSpeed;
        }else{
            scrolly = 0;
        }

        setTimeout(function(){

            if(scrolly){
                scrollY(el, scrolly);
            }

            if(scrollx){
                scrollX(el, scrollx);
            }

        });
    }

    function scrollY(el, amount){
        if(el === window){
            window.scrollTo(el.pageXOffset, el.pageYOffset + amount);
        }else{
            //el.scrollTop = el.scrollTop + amount;
            el.scrollTop += amount;
        }
    }

    function scrollX(el, amount){
        if(el === window){
            window.scrollTo(el.pageXOffset + amount, el.pageYOffset);
        }else{
            //el.scrollLeft = el.scrollLeft + amount;
            el.scrollLeft += amount;
        }
    }

}

module.exports = function AutoScrollerFactory(element, options){
    return new AutoScroller(element, options);
};

function getRect(el){
    if(el === window){
        return {
            top: 0,
            left: 0,
            right: window.innerWidth,
            bottom: window.innerHeight,
            width: window.innerWidth,
            height: window.innerHeight
        };

    }else{
        try{
            return el.getBoundingClientRect();
        }catch(e){
            throw new TypeError("Can't call getBoundingClientRect on "+el);
        }

    }
}

function inside(point, el, rect){
    rect = rect || getRect(el);
    return (point.y > rect.top && point.y < rect.bottom &&
            point.x > rect.left && point.x < rect.right);
}

},{"create-point-cb":2}],2:[function(require,module,exports){
module.exports = function createPointCB(object){

    // A persistent object (as opposed to returned object) is used to save memory
    // This is good to prevent layout thrashing, or for games, and such

    // NOTE
    // This uses IE fixes which should be OK to remove some day. :)
    // Some speed will be gained by removal of these.

    // pointCB should be saved in a variable on return
    // This allows the usage of element.removeEventListener

    return function pointCB(event){

        event = event || window.event; // IE-ism
        object.target = event.target || event.srcElement || event.originalTarget;
        object.element = this;
        object.type = event.type;

        // Support touch
        // http://www.creativebloq.com/javascript/make-your-site-work-touch-devices-51411644

        if(event.targetTouches){
            object.x = event.targetTouches[0].clientX;
            object.y = event.targetTouches[0].clientY;
            object.pageX = event.pageX;
            object.pageY = event.pageY;
        }else{

            // If pageX/Y aren't available and clientX/Y are,
            // calculate pageX/Y - logic taken from jQuery.
            // (This is to support old IE)
            // NOTE Hopefully this can be removed soon.

            if (event.pageX === null && event.clientX !== null) {
                var eventDoc = (event.target && event.target.ownerDocument) || document;
                var doc = eventDoc.documentElement;
                var body = eventDoc.body;

                object.pageX = event.clientX +
                  (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
                  (doc && doc.clientLeft || body && body.clientLeft || 0);
                object.pageY = event.clientY +
                  (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
                  (doc && doc.clientTop  || body && body.clientTop  || 0 );
            }else{
                object.pageX = event.pageX;
                object.pageY = event.pageY;
            }

            // pageX, and pageY change with page scroll
            // so we're not going to use those for x, and y.
            // NOTE Most browsers also alias clientX/Y with x/y
            // so that's something to consider down the road.

            object.x = event.clientX;
            object.y = event.clientY;
        }

    };

    //NOTE Remember accessibility, Aria roles, and labels.
};

/*
git remote add origin https://github.com/hollowdoor/create_point_cb.git
git push -u origin master
*/

},{}]},{},[1])(1)
});