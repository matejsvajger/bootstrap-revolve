// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;( function( $, window, document, undefined ) {

    "use strict";

    // undefined is used here as the undefined global variable in ECMAScript 3 is
    // mutable (ie. it can be changed by someone else). undefined isn't really being
    // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
    // can no longer be modified.

    // window and document are passed through as local variables rather than global
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in the plugin).

    var Revolve = function (element, options) {
        this.options             = options
        this.$body               = $(document.body)
        this.$element            = $(element)
        this.$modal              = $(options.template);
        this.image               = $(element).attr('href')
        this.images              = []
        this.frames              = []
        this.loaded              = 0
        this.rotation            = 0
        this.startPosition       = 0
        this.startRotation       = 0

        if( $('#revolve-modal').length == 0 ) $('body').append( this.$modal );

        this.$modal
            .find('.modal-body')
            .css('cursor', 'ew-resize')
            .css('position', 'relative')
            .bind('mousedown touchstart', $.proxy(this.mouseDownHandler, this) );

        $(document).bind('mouseup touchend', $.proxy(this.mouseUpHandler, this) );
    }

    Revolve.VERSION  = '0.0.1';

    Revolve.DEFAULTS = {
        frames: 24,
        addicon: true,
        icon: '<div><small>360° <span class="glyphicon glyphicon-refresh" aria-hidden="true"></span></small></div>',
        template: [
            '<div id="revolve-modal" class="modal fade" tabindex="-1" role="dialog">',
              '<div class="modal-dialog" role="document">',
                '<div class="modal-content">',
                  '<div class="modal-body text-center">',
                  '</div>',
                '</div>',
              '</div>',
            '</div>'
        ].join('')
    }

    Revolve.prototype.init = function (_relatedTarget) {
        //- Prepare files
        var file = this.image.split('.'),
            filename = file.shift().split('-').shift(),
            filetype = file.pop(),
            i = 1;

        while (i <= this.options.frames) {
            this.frames.push(filename + '-' + i + '.' + filetype);
            i++;
        }

        //- Add icon to thumb.
        this.addicon();
    }

    Revolve.prototype.show = function (_relatedTarget) {
        if(this.images.length == 0) {
            this.preload();
        }

        var icon = $(this.options.icon)
            .css('position', 'absolute')
            .css('color', '#000')
            .css('bottom', '16px')
            .css('right', '20px');

        $(this.$modal)
            .find('.modal-body')
            .html( $(this.images).first() )

        if(this.options.addicon) {
            $(this.$modal)
                .find('.modal-body')
                .append(icon);
        }

        $(this.$modal)
            .modal('show');
    }

    Revolve.prototype.preload = function (_relatedTarget) {
        for (var key in this.frames) {
            var image = document.createElement('img');

            $(image).one('load', $.proxy(this.loadHanlder, this));
            image.ondragstart = function() { return false; }
            image.src = this.frames[key];
            image.style.width = '100%';

            this.images.push(image);
        };
    }

    Revolve.prototype.loadHanlder = function ( e ) {
        this.loaded++;
        if (this.loaded == this.frames.length) {
            this.$element.trigger('loaded.bs.revolve');
        }
    }

    Revolve.prototype.addicon = function (_relatedTarget) {
        if(this.options.addicon) {
            this.$element
                .css('position', 'relative')
                .css('display', 'block');

            var icon = $(this.options.icon)
                .css('position', 'absolute')
                .css('color', '#000')
                .css('bottom', '4px')
                .css('right', '8px');

            this.$element.append(icon);
        }
    }

    Revolve.prototype.mouseUpHandler = function ( e ) {
        this.$modal.find('.modal-body').off( 'mousemove touchmove' );
    }

    Revolve.prototype.mouseDownHandler = function ( e ) {
        this.startRotation = this.rotation;
        this.startPosition = (e.type.toLowerCase() === 'mousedown')
            ? e.pageX
            : e.originalEvent.touches[0].pageX;

        this.$modal.find('.modal-body').bind('mousemove touchmove', $.proxy(this.mouseMoveHandler, this) );
    }

    Revolve.prototype.mouseMoveHandler = function ( e ) {
        var pageX = (e.type.toLowerCase() === 'mousemove')
            ? e.pageX
            : e.originalEvent.touches[0].pageX;

        var delta = this.startPosition - pageX;
        var newRotation = this.startRotation + delta / 2.5;

        this.rotation = ((newRotation % 360) + 360) % 360;

        var frameNo = 1 + Math.round (this.rotation / 360 * (this.frames.length - 1));
            frameNo = (frameNo != (this.frames.length)) ? frameNo : 0;

        this.$modal.find('img').attr('src', this.frames[frameNo]);
    }

    // The actual plugin constructor
    function Plugin(option, _relatedTarget) {
        return this.each(function () {
            var $this   = $(this);
            var data    = $this.data('bs.revolve');
            var options = $.extend({}, Revolve.DEFAULTS, $this.data(), typeof option == 'object' && option);

            if (!data) $this.data('bs.revolve', (data = new Revolve(this, options)));

            // Call the plugin method or default to show
            (typeof option == 'string') ?
                data[ option ](_relatedTarget):
                data.show(_relatedTarget)
        })
    }

    var old = $.fn.revolve

    $.fn.revolve             = Plugin
    $.fn.revolve.Constructor = Revolve

    //- No Conflict
    $.fn.revolve.noConflict = function () {
        $.fn.revolve = old
        return this
    }

    //- Data API
    $(document).on('click.bs.revolve.data-api', '[data-toggle="revolve"]', function (e) {
        var $this   = $(this);
        var option  = $this.data('bs.revolve') ? 'show' : $this.data();

        if ($this.is('a')) e.preventDefault();

        Plugin.call($this, option, this);
    })

    //- Init
    $(function(){
        $('[data-toggle="revolve"]').each(function(){
            var $this   = $(this);
            Plugin.call($this, 'init', this);
        });
    });


} )( jQuery, window, document );
