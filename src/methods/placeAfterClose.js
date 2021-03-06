jQuery(function () {
    (function ($, wnd, undefined) {
        $.dropper.setMethod('placeAfterClose', function (dropper, $this, opt) {
            if (opt.place === 'inherit' || !opt.placeAfterClose)
                return false;
            if (!_isScrollable.call($('body'), 'y'))
                $('body').css('overflow-y', 'hidden');
            if (!_isScrollable.call($('body'), 'x'))
                $('body').css('overflow-x', 'hidden');
            if (!opt)
                return this;
            var pmt = opt.placeAfterClose.toLowerCase().split(' '),
                t = -dropper[$.dropper.drp.actual]('outerHeight'),
                l = -dropper[$.dropper.drp.actual]('outerWidth');
            if (pmt[1] === 'bottom')
                t = wnd.height();
            if (pmt[0] === 'right')
                l = wnd.width();
            if (pmt[0] === 'center' || pmt[1] === 'center') {
                if (pmt[0] === 'left') {
                    l = -dropper[$.dropper.drp.actual]('outerWidth');
                    t = dropper.css('top');
                }
                if (pmt[0] === 'right') {
                    l = wnd.width();
                    t = dropper.css('top');
                }
                if (pmt[1] === 'top') {
                    t = -dropper[$.dropper.drp.actual]('outerHeight');
                    l = dropper.css('left');
                }
                if (pmt[1] === 'bottom') {
                    t = wnd.height();
                    l = dropper.css('left');
                }
            }
            if (opt.placeAfterClose !== 'center center') {
                if (pmt[0] === 'inherit') {
                    t = $this.offset().left;
                    l = $this.offset().top;
                }
                else {
                    t += wnd.scrollTop();
                    l += wnd.scrollLeft();
                }
                dropper.animate({
                    'left': l,
                    'top': t
                }, {
                    queue: false,
                    duration: opt.durationOff
                });
            }
            return this;
        });
        var _isScrollable = function (side) {
            if (!$.dropper.drp.existsN(this))
                return this;
            var el = this.get(0),
                x = el.clientWidth && el.scrollWidth > el.clientWidth,
                y = el.clientHeight && el.scrollHeight > el.clientHeight;
            return !side ? (!(el.style.overflow && el.style.overflow === 'hidden') && (x || y)) : (side === 'x' ? !(el.style.overflowX === 'hidden') && x : !(el.style.overflowY === 'hidden') && y);
        };
    })(jQuery, jQuery(window));
});