$.drop.methods.global = function(start) {
    var $ = jQuery,
            wnd = $(window);
    return this.each(function() {
        var drop = $(this),
                drp = drop.data('drp');
        if (!drp && drp.droppableIn)
            return false;
        var method = drp.animate && !start ? 'animate' : 'css',
                $this = drp.elrun,
                t = 0,
                l = 0,
                $thisW = $this.width(),
                $thisH = $this.height(),
                dropW = +drop.actual('width'),
                dropH = +drop.actual('height'),
                offTop = $this.offset().top,
                offLeft = $this.offset().left,
                $thisT = 0,
                $thisL = 0;

        if (!drop.is(':visible'))
            drop.css({top: 'auto', bottom: 'auto', left: 'auto', right: 'auto'});

        if ($.type(drp.placement) === 'object') {
            if (drp.placement.left + dropW > wnd.width())
                drp.placement.left -= dropW;
            if (drp.placement.top + dropH > wnd.height()) {
                drp.placement.top -= dropH;
            }
            drop[method](drp.placement, {
                duration: drp.durationOn,
                queue: false
            });
        }
        else {
            var pmt = drp.placement.toLowerCase().split(' ');
            if (pmt[1] === 'top')
                t = -drop.actual('outerHeight');
            if (pmt[1] === 'bottom')
                t = $thisH;
            if (pmt[0] === 'left')
                l = 0;
            if (pmt[0] === 'right')
                l = -dropW - $thisW;
            if (pmt[0] === 'center')
                l = -dropW / 2 + $thisW / 2;
            if (pmt[1] === 'center')
                t = -dropH / 2 + $thisH / 2;
            $thisT = offTop + t;
            $thisL = offLeft + l;
            if ($thisL < 0)
                $thisL = 0;
            drop[method]({
                'top': $thisT,
                'left': $thisL
            }, {
                duration: drp.durationOn,
                queue: false
            });
        }
    });
};