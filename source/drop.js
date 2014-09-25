(function($, wnd, doc) {
    (function($) {
        $.fn.actual = function() {
            if (arguments.length && $.type(arguments[0]) === 'string') {
                var dim = arguments[0],
                        clone = this.clone();
                if (arguments[1] === undefined)
                    clone.css({
                        position: 'absolute',
                        top: '-9999px'
                    }).show().appendTo($('body'));
                var dimS = clone[dim]();
                clone.remove();
                return dimS;
            }
            return undefined;
        };
    })(jQuery);
    $.existsN = function(nabir) {
        return nabir && nabir.length > 0 && nabir instanceof jQuery;
    };
    $.exists = function(selector) {
        return $(selector).length > 0 && $(selector) instanceof jQuery;
    };
    var IE = navigator.userAgent.match(/msie/i);
    var methods = {
        init: function(options) {
            var set = $.extend({}, DP, options);
            if (!$.existsN(this))
                throw 'this object is not exists';

            return this.each(function() {
                var el = methods.destroy.call($(this)),
                        opt = $.extend({}, set, el.data());
                el.data('drp', opt);
                var rel = this.rel || opt.rel,
                        ahref = $.trim(el.attr('href')),
                        href = $.trim(ahref || opt.href);
                opt.href = href && href.indexOf('#') === 0 ? null : href;
                opt.hash = ahref.indexOf('#') === 0 && ahref !== '#' ? ahref : opt.hash;
                if (rel) {
                    rel = rel.replace(D.reg, '');
                    if (opt.href) {
                        if (!D.galleries[rel])
                            D.galleries[rel] = [];
                        if (!D.galleryHashs[rel] && opt.hash)
                            D.galleryHashs[rel] = [];
                        if ($.inArray(opt.href, D.galleries[rel]) === -1 && opt.href.match(D.regImg))
                            D.galleries[rel].push(opt.href);
                        if (opt.hash)
                            D.galleryHashs[rel].push(opt.hash);
                    }
                }
                else if (opt.hash && $.inArray(opt.hash, D.galleryHashs._butRel) === -1)
                    D.galleryHashs._butRel.push(opt.hash);
                el.addClass('isDrop');
                if (opt.context) {
                    el.on('contextmenu.' + $.drop.nS + ' ' + 'click.' + $.drop.nS, function(e) {
                        e.preventDefault();
                    });
                    el.on('mouseup.' + $.drop.nS, function(e) {
                        e.preventDefault();
                        if (e.button === 2)
                            methods.open.call($(this), opt, e);
                    });
                }
                else {
                    if (opt.triggerOn || opt.triggerOff)
                        el.on(opt.triggerOn + '.' + $.drop.nS + ' ' + opt.triggerOff + '.' + $.drop.nS, function(e) {
                            e.stopPropagation();
                            e.preventDefault();
                        }).on(opt.triggerOn + '.' + $.drop.nS, function(e) {
                            methods.open.call($(this), opt, e);
                        }).on(opt.triggerOff + '.' + $.drop.nS, function(e) {
                            methods.close.call($(el.attr('data-drop')), e);
                        });
                    else
                        el.on(opt.trigger + '.' + $.drop.nS, function(e) {
                            methods.open.call($(this), opt, e);
                            e.stopPropagation();
                            e.preventDefault();
                        });
                }
                if (/#.+/.test(opt.hash) && !D.hashs[opt.hash])
                    D.hashs[opt.hash] = el;
            }).each(function() {
                if (window.location.hash.indexOf($(this).data('drp').hash) !== -1)
                    methods.open.call($(this));
            });
        },
        destroy: function(el) {
            return (el || this).each(function() {
                var el = $(this),
                        opt = $(el).data('drp');
                el.removeClass('isDrop').removeData('drp');
                if (!opt)
                    return;
                if (opt.trigger)
                    el.off(opt.trigger + '.' + $.drop.nS);
                if (opt.triggerOn)
                    el.off(opt.triggerOn + '.' + $.drop.nS);
                if (opt.triggerOff)
                    el.off(opt.triggerOff + '.' + $.drop.nS);
                el.off('contextmenu.' + $.drop.nS).off('mouseup.' + $.drop.nS).off('click.' + $.drop.nS);
            });
        },
        _get: function(opt, e, hashChange) {
            var hrefC = opt.href.replace(D.reg, '');
            if (D.curAjax[hrefC]) {
                D.curAjax[hrefC].abort();
                D.curAjax[hrefC] = null;
            }
            var el = this,
                    elSet = el.data();
            var _update = function(data) {
                if (opt.dropn)
                    var drop = methods._pasteDrop(opt, data);
                else
                    drop = methods._pasteDrop(opt, opt.pattern);
                if (!opt.dropn)
                    drop.find($(opt.placePaste)).html(data);
                drop.addClass(D.pC + opt.type);
                if (!opt.always && !opt.notify)
                    D.drops[hrefC] = drop.clone();
                doc.trigger({
                    type: 'successHtml.' + $.drop.nS,
                    drp: {
                        refer: el,
                        drop: drop,
                        options: opt,
                        datas: data
                    }
                });
                methods._show.call(el, drop, e, opt, hashChange);
                return drop;
            };
            $.drop.showLoading();
            var _getImage = function() {
                opt.type = elSet.type = 'image';
                var img = D.imgPreload = new Image();
                img.onload = function() {
                    $.drop.hideLoading();
                    this.onload = this.onerror = null;
                    _update($(this));
                };
                img.onerror = function() {
                    this.onload = this.onerror = null;
                    $.drop.hideLoading();
                    methods.open.call(null, {notify: true, datas: {answer: 'error', data: 'image is not found'}});
                };
                img.src = opt.href + (opt.always ? '?' + (+new Date()) : '');
            };
            var _getAjax = function() {
                opt.type = elSet.type = 'ajax';
                D.curAjax[hrefC] = $.ajax($.extend({}, opt.ajax, {
                    url: opt.href,
                    dataType: opt.ajax.dataType ? opt.ajax.dataType : (opt.notify ? 'json' : 'html'),
                    success: function(data) {
                        $.drop.hideLoading();
                        if (opt.notify)
                            methods._pasteNotify.call(el, data, opt, hashChange, e);
                        else
                            _update(data);
                    },
                    error: function() {
                        $.drop.hideLoading();
                        if (arguments[2].message)
                            methods.open.call(null, {notify: true, datas: {answer: 'error', data: arguments[2].message}});
                    }
                }));
            };
            var _getIframe = function() {
                opt.type = elSet.type = 'iframe';
                var iframe = $('<iframe name="drop-iframe" frameborder="0" vspace="0" hspace="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen' + (IE ? ' allowtransparency="true"' : '') + '></iframe>');
                iframe.one('load.' + $.drop.nS, function() {
                    $.drop.hideLoading();
                });
                _update(iframe);
            };
            if (opt.type === 'auto') {
                if (opt.href.match(D.regImg))
                    _getImage();
                else
                    _getAjax();
            }
            else
                switch (opt.type) {
                    case 'image':
                        _getImage();
                        break;
                    case 'iframe':
                        _getIframe();
                        break;
                    default:
                        _getAjax();
                }
            return el;
        },
        open: function(opt, e, hashChange) {
            var $this = $.existsN(this) ? this : $([]),
                    elSet = $.existsN($this) ? $this.data() : {};
            opt = $.extend({}, DP, elSet && elSet.drp ? elSet.drp : {}, opt);
            e = e ? e : window.event;
            
            var drop = $(elSet.drop);
            if (opt.closeActiveClick && $.existsN(drop) && $this.hasClass(D.activeClass)) {
                $this.removeClass(D.activeClass);
                methods.close.call(drop, 'element already open');
                return $this;
            }
            else if (drop.data('drp'))
                drop.removeClass(drop.data('drp').tempClass);

            if (elSet.tempClass && !elSet.dropn)
                elSet.drop = opt.drop = null;

            opt.tempClass = elSet.tempClass = opt.defaultClassBtnDrop + (+new Date());

            if (elSet || $.existsN(opt.drop))
                elSet.dropn = opt.drop;

            $.extend(opt, elSet);

            var href = $this.attr('href') || opt.href;
            opt.href = href && $.trim(href).indexOf('#') === 0 ? null : href;
            var hrefC = opt.href ? opt.href.replace(D.reg, '') : null;
            opt.rel = $this.attr('rel') || opt.rel;

            if (opt.rel && D.galleries[opt.rel.replace(D.reg, '')])
                opt.rel = opt.rel.replace(D.reg, '');
            if (opt.rel && D.gallerieOpt[opt.rel])
                $.extend(opt, D.gallerieOpt[opt.rel]['genOpt'], D.gallerieOpt[opt.rel][hrefC]);
            if (opt.href && (opt.notify || opt.always)) {
                $('[data-rel="' + opt.drop + '"]').add($(opt.drop)).remove();
                opt.drop = elSet.dropn ? elSet.dropn : null;
            }
            if (opt.context) {
                $.extend(opt, {place: 'global', limitSize: true, overlay: false});
                if (e && e.pageX >= 0)
                    opt.placement = {'left': parseInt(e.pageX), 'top': parseInt(e.pageY)};
                else
                    opt.placement = {'left': $this.offset().left, 'top': $this.offset().top};
            }

            opt.drop = opt.drop && $.type(opt.drop) === 'string' && !opt.notify ? opt.drop : '.' + opt.tempClass;

            if (!$.existsN($this) || opt.notify)
                $this = methods._referCreate(opt.drop);
            opt.elrun = $this;
            if (opt.dropFilter) {
                if ($this.hasClass('drop-filter')) {
                    opt.tempClass = null;
                    elSet.dropn = opt.drop;
                }
                else {
                    methods._filterSource.call($this, opt.dropFilter).addClass(opt.tempClass);
                    elSet.dropn = opt.drop = '.' + opt.tempClass;
                    $this.addClass('drop-filter');
                }
            }
            $this.attr('data-drop', opt.drop).data('drop', opt.drop);
            drop = $(elSet.dropn);
            var _confirmF = function() {
                if (opt.notify && opt.datas)
                    methods._pasteNotify.call($this, opt.datas, opt, hashChange, e);
                else if (opt.dropFilter)
                    methods._show.call($this, methods._pasteDrop(opt, drop.addClass(D.wasCreateClass)), e, opt, hashChange);
                else if (opt.html) {
                    drop = methods._pasteDrop(opt, opt.pattern);
                    drop.find($(opt.placePaste)).html(opt.html);
                    methods._show.call($this, drop, e, opt, hashChange);
                }
                else if (opt.href && (!D.drops[hrefC] || opt.always || opt.notify))
                    methods._get.call($this, opt, e, hashChange);
                else if ($.existsN(drop) || opt.href && D.drops[hrefC])
                    methods._show.call($this, methods._pasteDrop(opt, $.existsN(drop) ? drop.addClass(D.wasCreateClass) : D.drops[hrefC].clone()), e, opt, hashChange);
                else if (opt.header || opt.content || opt.footer)
                    methods._show.call($this, methods._pasteDrop(opt, opt.pattern), e, opt, hashChange);
                else
                    throw 'insufficient data';
            };
            function _show() {
                if ($this.is(':disabled') || opt.drop && opt.start && !eval(opt.start).call($this, opt, drop, e))
                    return $this;
                if (opt.prompt || opt.confirm || opt.alert)
                    methods._checkMethod(function() {
                        methods.confirmPromptAlert(opt, hashChange, _confirmF, e, $this);
                    });
                else
                    _confirmF();
            }
            ;
            if (!opt.moreOne && $.exists(D.aDS))
                return methods.close.call($(D.aDS), 'close more one element', _show);
            return _show();
        },
        _show: function(drop, e, opt, hashChange) {
            if (!opt.moreOne && $.exists(D.aDS))
                methods.close.call($(D.aDS), 'close more one element', $.proxy(_show, this));
            else
                _show.call(this);
            function _show() {
                if (!$.existsN(drop))
                    return false;
                e = e ? e : window.event;
                var $this = this,
                        overlays = $('.drop-overlay').css('z-index', 1103),
                        dropOver = null;
                if (opt.overlay) {
                    if (!$.exists('[data-rel="' + opt.drop + '"].drop-overlay'))
                        $('body').append('<div class="drop-overlay" data-rel="' + opt.drop + '"></div>');
                    (opt.dropOver = dropOver = $('[data-rel="' + opt.drop + '"].drop-overlay')).css({
                        'height': '',
                        'background-color': opt.overlayColor,
                        'opacity': opt.overlayOpacity,
                        'z-index': overlays.length + 1103
                    });
                }

                $('.drop-for-center').css('z-index', 1104);
                var forCenter = null;
                if (opt.place === 'center')
                    (forCenter = opt.forCenter = $('[data-rel="' + opt.drop + '"].drop-for-center')).css('z-index', overlays.length + 1104);
                drop.data('drp', opt).attr('data-rel', opt.rel).css('z-index', overlays.length + 1104).attr('data-elrun', opt.drop).addClass(D.pC + opt.place);
                if (opt.context)
                    drop.addClass(D.pC + 'context');

                if (opt.rel)
                    methods._checkMethod(function() {
                        methods.galleries(drop, opt);
                    });
                methods._setHeightAddons(dropOver, forCenter);
                methods._pasteContent($this, drop, opt);
                methods._positionType(drop);

                var ev = opt.drop ? opt.drop.replace(D.reg, '') : '';
                if (opt.hash && !hashChange) {
                    D.scrollTop = wnd.scrollTop();
                    var wLH = window.location.hash,
                            k = false;
                    wnd.off('hashchange.' + $.drop.nS);
                    if (opt.rel && !opt.moreOne && D.galleryHashs[opt.rel]) {
                        D.galleryHashs[opt.rel].map(function(n, i) {
                            if (wLH && wLH.indexOf(n) !== -1)
                                k = n;
                        });
                    }
                    if (k)
                        window.location.hash = wLH.replace(k, opt.hash);
                    else if (opt.hash.indexOf('#') !== -1 && (new RegExp(opt.hash + '#|' + opt.hash + '$').exec(wLH) === null))
                        window.location.hash = wLH + opt.hash;
                    wnd.scrollTop(D.scrollTop);
                    setTimeout(methods._setEventHash, 0);
                }
                wnd.off('resize.' + $.drop.nS + ev).on('resize.' + $.drop.nS + ev, function(e) {
                    methods.update.call(drop);
                });
                wnd.off('scroll.' + $.drop.nS + ev).on('scroll.' + $.drop.nS + ev, function(e) {
                    if (opt.place === 'center' && opt.centerOnScroll)
                        methods._checkMethod(function() {
                            methods[opt.place].call(drop);
                        }, opt.place);
                });
                $(dropOver).stop().fadeIn(opt.durationOn / 2);
                $(forCenter).add(dropOver).off('click.' + $.drop.nS + ev).on('click.' + $.drop.nS + ev, function(e) {
                    e.stopPropagation();
                    if (opt.closeClick && $(e.target).is('.drop-overlay') || $(e.target).is('.drop-for-center'))
                        methods.close.call($($(e.target).attr('data-rel')).filter('.' + opt.tempClass), e);
                });
                if (opt.alert || opt.confirm || opt.prompt) {
                    var elFocus;
                    if (opt.alert)
                        elFocus = opt.alertActionBtn;
                    else if (opt.confirm)
                        elFocus = opt.confirmActionBtn;
                    else if (opt.prompt)
                        elFocus = opt.promptInput;
                    elFocus = drop.find(elFocus);
                    if (opt.prompt) {
                        elFocus.val(opt.promptInputValue);
                        drop.find('form').off('submit.' + $.drop.nS + ev).on('submit.' + $.drop.nS + ev, function(e) {
                            e.preventDefault();
                        });
                    }
                    var focusFunc = function() {
                        elFocus.focus();
                    };
                    setTimeout(focusFunc, 0);
                }
                opt.exit = $.type(opt.exit) === 'string' ? drop.find(opt.exit) : opt.exit;
                if ($.existsN(opt.exit)) {
                    if (opt.closeClick)
                        opt.exit.show().off('click.' + $.drop.nS).on('click.' + $.drop.nS, function(e) {
                            e.stopPropagation();
                            methods.close.call($(this).closest('[data-elrun]'), e);
                        });
                    else
                        opt.exit.hide();
                }
                doc.off('keyup.' + $.drop.nS);
                if (opt.closeEsc)
                    doc.on('keyup.' + $.drop.nS, function(e) {
                        if (e.keyCode === 27)
                            methods.close.call(null, e);
                    });
                $('html, body').css('height', '100%');
                doc.off('click.' + $.drop.nS + ev).on('click.' + $.drop.nS + ev, function(e) {
                    if (opt.closeClick && !$.existsN($(e.target).closest('[data-elrun]')))
                        methods.close.call(null, e);
                });
                if (opt.context)
                    var collect = drop.add(dropOver).add(forCenter).on('contextmenu.' + $.drop.nS, function(e) {
                        e.preventDefault();
                    });
                var dropWH = opt.type === 'iframe' ? drop.find('iframe') : drop;
                if (opt.width)
                    dropWH.css('width', opt.width);
                if (opt.height)
                    dropWH.css('height', opt.height);
                $('style' + '[data-rel="' + opt.drop + '"]').remove();
                opt.style = methods._styleCreate(opt);
                if (opt.limitSize)
                    methods._checkMethod(function() {
                        methods.limitSize(drop);
                    });
                methods._checkMethod(function() {
                    methods.placeBeforeShow(drop, $this, opt);
                });
                if (opt.place !== 'inherit')
                    methods._checkMethod(function() {
                        methods[opt.place].call(drop);
                    }, opt.place);
                $(forCenter).show();

                if (opt.elBefore)
                    eval(opt.elBefore).call($this, opt, drop, e);
                if (opt.before)
                    opt.before.call($this, opt, drop, e);
                if (opt.beforeG)
                    opt.beforeG.call($this, opt, drop, e);
                drop.add(doc).trigger({
                    type: 'before.' + $.drop.nS,
                    drp: {
                        event: e,
                        refer: $this,
                        drop: drop,
                        options: opt
                    }
                });
                drop[opt.effectOn](opt.durationOn, function(e) {
                    var drop = $(this);
                    if (opt.type === 'iframe')
                        dropWH.attr('src', opt.href);
                    $('html, body').css({'overflow': '', 'overflow-x': ''});
                    methods._setHeightAddons(dropOver, forCenter);
                    if (opt.context)
                        collect.off('contextmenu.' + $.drop.nS);
                    var inDrop = opt.type === 'iframe' ? drop.find('iframe').contents().find('[data-drop]') : drop.find('[data-drop]');
                    if ($.existsN(inDrop))
                        methods.init.call(inDrop);
                    drop.add($this).addClass(D.activeClass);
                    if (opt.notify && !isNaN(opt.timeclosenotify))
                        D.notifyTimeout[opt.drop] = setTimeout(function() {
                            methods.close.call(drop, 'close notify setTimeout');
                        }, opt.timeclosenotify);
                    if (opt.droppable && opt.place !== 'inherit')
                        methods._checkMethod(function() {
                            methods.droppable(drop);
                        });
                    var cB = opt.elAfter;
                    if (cB)
                        eval(cB).call($this, opt, drop, e);
                    if (opt.after)
                        opt.after.call($this, opt, drop, e);
                    if (opt.afterG)
                        opt.afterG.call($this, opt, drop, e);
                    drop.add(doc).trigger({
                        type: 'after.' + $.drop.nS,
                        drp: {
                            event: e,
                            refer: $this,
                            drop: drop,
                            options: opt
                        }
                    });
                });
            }
            return this;
        },
        close: function(e, f, hashChange) {
            var sel = this,
                    drop = $.existsN(sel) ? sel : $('[data-elrun].' + D.activeClass);
            var closeLength = drop.length;
            drop.each(function(i) {
                var drop = $(this),
                        opt = $.extend({}, drop.data('drp'));

                if (!drop.data('drp'))
                    return false;
                if (hashChange && opt.hash && window.location.hash.indexOf(opt.hash) !== -1)
                    return false;
                if (!(opt.notify || $.existsN(sel) || opt.place !== 'inherit' || opt.inheritClose || opt.overlay) && opt.elrun)
                    return false;
                var _hide = function() {
                    if (opt.notify && D.notifyTimeout[opt.drop]) {
                        clearTimeout(D.notifyTimeout[opt.drop]);
                        delete D.notifyTimeout[opt.drop];
                    }
                    if (opt.type === 'iframe')
                        drop.find('iframe').removeAttr('src');
                    var ev = opt.drop ? opt.drop.replace(D.reg, '') : '';
                    wnd.off('resize.' + $.drop.nS + ev).off('scroll.' + $.drop.nS + ev);
                    doc.off('keydown.' + $.drop.nS + ev).off('keyup.' + $.drop.nS).off('click.' + $.drop.nS + ev);
                    drop.add(opt.elrun).removeClass(D.activeClass);
                    if (opt.hash && !hashChange) {
                        D.scrollTop = wnd.scrollTop();
                        wnd.off('hashchange.' + $.drop.nS);
                        window.location.hash = window.location.hash.replace(opt.hash, '');
                        wnd.scrollTop(D.scrollTop);
                        setTimeout(methods._setEventHash, 0);
                    }
                    methods._checkMethod(function() {
                        methods.placeAfterClose(drop, opt.elrun, opt);
                    });
                    $(opt.dropOver).fadeOut(opt.durationOff);
                    drop[opt.effectOff](opt.durationOff, function() {
                        opt.style.remove();
                        $('html, body').css({'overflow': '', 'overflow-x': ''});
                        var $this = $(this);
                        $(opt.forCenter).hide();
                        methods._resetStyleDrop.call($(this));
                        $this.removeClass(D.pC + opt.place).removeClass(D.pC + opt.type).removeClass(D.pC + 'context');
                        if (opt.closed)
                            opt.closed.call(opt.elrun, opt, $this, e);
                        if (opt.elClosed)
                            eval(opt.elClosed).call(opt.elrun, opt, $this, e);
                        if (opt.closedG)
                            opt.closedG.call(opt.elrun, opt, $this, e);
                        $this.add(doc).trigger({
                            type: 'closed.' + $.drop.nS,
                            drp: {
                                event: e,
                                refer: opt.elrun,
                                drop: $this,
                                options: opt
                            }
                        });
                        var dC = $this.find($(opt.dropContent)).data('jsp');
                        if (dC)
                            dC.destroy();
                        if (!$.exists(D.aDS))
                            $('html, body').css('height', '');

                        if (!opt.dropFilter)
                            $this.removeClass(opt.tempClass);
                        if (!opt.elrun.data('dropn'))
                            opt.elrun.data('drop', null);
                        if ($(opt.elrun).hasClass(D.tempClass))
                            $(opt.elrun).parent().remove();
                        if (!$this.hasClass(D.wasCreateClass))
                            $this.remove();
                        if ($this.hasClass(D.wasCreateClass) && opt.place !== 'inherit')
                            $this.appendTo($('body'));
                        $(opt.dropOver).add($(opt.forCenter)).remove();

                        $this.data('drp', null);
                        if (i === closeLength - 1 && $.isFunction(f))
                            f();
                    });
                };
                drop.add(doc).trigger({
                    type: 'close.' + $.drop.nS,
                    drp: {
                        event: e,
                        refer: opt.elrun,
                        drop: drop,
                        options: opt
                    }
                });
                var close = opt.elClose || opt.close || opt.closeG;
                if (close) {
                    if ($.type(close) === 'string')
                        var res = eval(close).call(opt.elrun, opt, drop, e);
                    else
                        var res = close.call(opt.elrun, opt, drop, e);
                    if (res === false && res !== true)
                        throw res;
                    else
                        _hide();
                }
                else
                    _hide();
            });
            return sel;
        },
        update: function() {
            var drop = this,
                    drp = drop.data('drp');
            if (!drp)
                return false;
            if (drp.limitSize)
                methods._checkMethod(function() {
                    methods.limitSize(drop);
                });
            if (drp.place !== 'inherit')
                methods._checkMethod(function() {
                    methods[drp.place].call(drop);
                }, drp.place);
            methods._setHeightAddons(drp.dropOver, drp.forCenter);
        },
        center: function(start) {
            return this.each(function() {
                var drop = $(this),
                        drp = drop.data('drp');
                if (!drp)
                    return false;
                if (!drp.droppableIn) {
                    var method = drp.animate && !start ? 'animate' : 'css',
                            dropV = drop.is(':visible'),
                            w = dropV ? drop.outerWidth() : drop.actual('outerWidth'),
                            h = dropV ? drop.outerHeight() : drop.actual('outerHeight'),
                            wndT = wnd.scrollTop(),
                            wndL = wnd.scrollLeft(),
                            top = Math.floor((wnd.height() - h) / 2),
                            left = Math.floor((wnd.width() - w) / 2);
                    top = top > 0 ? top + wndT : wndT;
                    left = left > 0 ? left + wndL : wndL;
                    if (top + h > doc.height() || left + w > doc.width())
                        return false;
                    drop[method]({
                        'top': top,
                        'left': left
                    }, {
                        duration: drp.durationOn,
                        queue: false
                    });
                }
                else if (drp.droppableIn && drp.positionDroppableIn)
                    drop.css({
                        'top': drp.positionDroppableIn.top,
                        'left': drp.positionDroppableIn.left
                    });
            });
        },
        _resetStyleDrop: function() {
            return this.css({
                'z-index': '',
                'top': '',
                'left': '',
                'bottom': '',
                'right': '',
                'position': ''
            });
        },
        _pasteNotify: function(datas, opt, hashChange, e) {
            if (!$.isFunction(opt.handleNotify))
                return false;
            var el = this,
                    drop = methods._pasteDrop(opt, opt.patternNotify);

            el.off('successJson.' + $.drop.nS).on('successJson.' + $.drop.nS, function(e) {
                e.stopPropagation();
                opt.handleNotify.call($(this), e, opt);
            }).add(wnd).trigger({
                type: 'successJson.' + $.drop.nS,
                drp: {
                    refer: el,
                    drop: drop,
                    options: opt,
                    datas: el.data('datas') || datas
                }
            });
            return methods._show.call(el, drop, e, opt, hashChange);
        },
        _pasteDrop: function(opt, drop) {
            drop = $(drop);
            if (opt.dropn)
                drop = $.existsN(drop.filter(opt.drop)) ? drop.filter(opt.drop) : ($.existsN(drop.find(opt.drop)) ? drop.find(opt.drop) : drop);

            if (opt.place === 'inherit' && opt.placeInherit)
                $(opt.placeInherit)[opt.methodPlaceInherit](drop);
            else if (opt.place === 'global')
                drop.appendTo($('body'));
            else if (opt.place === 'center')
                drop.appendTo($('<div class="drop-for-center" data-rel="' + opt.drop + '"></div>').appendTo($('body')));

            return drop.addClass(opt.tempClass).attr('data-elrun', opt.drop);
        },
        _pasteContent: function($this, drop, opt) {
            var _checkCont = function(place) {
                if (place.is(':empty'))
                    place.removeClass(D.noEmptyClass).addClass(D.emptyClass);
                else
                    place.addClass(D.noEmptyClass).removeClass(D.emptyClass);
            };
            var _pasteContent = function(content, place) {
                place = drop.find(place).first();
                if (!$.existsN(place))
                    return false;
                _checkCont(place);
                if (!content)
                    return false;
                place.empty();
                content = $.type(content) === 'function' ? content.call(place, opt, drop, $this) : content;
                if (content)
                    place.append(content);
                _checkCont(place);
            };
            _pasteContent(opt.header, opt.dropHeader);
            _pasteContent(opt.content, opt.dropContent);
            _pasteContent(opt.footer, opt.dropFooter);
            return this;
        },
        _setHeightAddons: function(dropOver, forCenter) {
            $(forCenter).add(dropOver).css('height', '').css('height', doc.height());
        },
        _checkMethod: function(f, nm) {
            try {
                f();
            } catch (e) {
                if (window.console) {
                    var method = f.toString().match(/\.\S*\(/);
                    console.log('need connect "' + (nm ? nm : method[0].substring(1, method[0].length - 1)) + '" method');
                }
            }
            return this;
        },
        _positionType: function(drop) {
            if (drop.data('drp') && drop.data('drp').place !== 'inherit')
                drop.css({
                    'position': drop.data('drp').position
                });
            return this;
        },
        _filterSource: function(s) {
            var btn = this,
                    href = s.split(').'),
                    regS, regM = '';
            $.map(href, function(v) {
                regS = (v[v.length - 1] !== ')' ? v + ')' : v).match(/\(.*\)/);
                regM = regS['input'].replace(regS[0], '');
                regS = regS[0].substring(1, regS[0].length - 1);
                btn = btn[regM](regS);
            });
            return btn;
        },
        _isScrollable: function(el) {
            return (el && !(el.style.overflow && el.style.overflow === 'hidden') && ((el.clientWidth && el.scrollWidth > el.clientWidth) || (el.clientHeight && el.scrollHeight > el.clientHeight)));
        },
        _setEventHash: function() {
            D.wLH = window.location.hash;
            wnd.off('hashchange.' + $.drop.nS).on('hashchange.' + $.drop.nS, function(e) {
                e.preventDefault();
                if (D.scrollTop)
                    $('html, body').scrollTop(D.scrollTop);
                D.wLHN = window.location.hash;
                for (var i in D.hashs) {
                    if (D.wLH.indexOf(i) === -1 && D.wLHN.indexOf(i) !== -1)
                        methods.open.call(D.hashs[i], null, e, true);
                    else
                        methods.close.call($(D.hashs[i].data('drop')).add(D.hashs[i].data('dropConfirmPromptAlert')), e, null, true);
                }
                D.wLH = D.wLHN;
            });
        },
        _referCreate: function(sel) {
            return $('<div><button data-drop="' + sel + '" class="' + D.tempClass + '"></button></div>').appendTo($('body')).hide().children();
        },
        _styleCreate: function(opt) {
            if (!D.theme[opt.theme])
                throw 'theme' + ' "' + opt.theme + '" ' + 'not available';
            var text = D.theme[opt.theme],
                    coms = D.theme[opt.theme].match(/.*,([^{]*)/gm);
            if (coms)
                $.map(coms, function(n) {
                    n = n.split('{')[0];
                    text = text.replace(n, n.replace(/,(?!(\s*\[drop\])|(\s*\[\[))/g, ', ' + opt.drop + ' '));
                });
            text = text.replace(/\}[^$](?!(\s*\[drop\])|(\s*\[\[))/g, '} ' + opt.drop + ' ').replace(/^(?!(\s*\[drop\])|(\s*\[\[))/, opt.drop + ' ').replace(/\[\[(.*?)\]\]/g, '$1').replace(/\[drop\]/g, opt.drop).replace(/\s\s+/g, ' ');
            return $('<style>', {
                'data-rel': opt.drop,
                text: text
            }).appendTo($('body'));
        }
    };
    $.fn.drop = function(method) {
        if (methods[method]) {
            if (!/_/.test(method))
                return methods[ method ].apply(this, Array.prototype.slice.call(arguments, 1));
            else
                throw 'Method ' + method + ' is private on $.drop';
        }
        else if ($.type(method) === 'object' || !method)
            return methods.init.apply(this, arguments);
        else
            throw 'Method ' + method + ' does not exist on $.drop';
    };
    $.drop = function(m, opt) {
        if (!opt)
            opt = {};
        var set;
        if ($.existsN(m))
            set = {'drop': m};
        else if ($.type(m) === 'array' || $.type(m) === 'string' && m.match(D.regImg)) {
            if ($.type(m) === 'array') {
                if (m.length > 1) {
                    opt.rel = opt.rel ? opt.rel : 'rel' + (+new Date());
                    if (!D.gallerieOpt[opt.rel])
                        D.gallerieOpt[opt.rel] = {};
                    D.gallerieOpt[opt.rel]['genOpt'] = $.extend({}, opt);
                    if (!D.galleries[opt.rel])
                        D.galleries[opt.rel] = [];
                    m.map(function(n) {
                        if ($.type(n) === 'string' && $.inArray(n, D.galleries[opt.rel]) === -1 && n.match(D.regImg))
                            D.galleries[opt.rel].push(n);
                        else if ($.type(n) === 'object' && n.href && $.inArray(n.href, D.galleries[opt.rel]) === -1 && n.href.match(D.regImg)) {
                            D.gallerieOpt[opt.rel][n.href.replace(D.reg, '')] = n;
                            D.galleries[opt.rel].push(n.href);
                        }
                        else
                            return;
                    });
                    if (D.galleries[opt.rel][0])
                        set = {href: D.galleries[opt.rel][0]};
                    else
                        throw 'insufficient data';
                }
                else if ($.type(m[0]) === 'object')
                    set = m[0];
                else if ($.type(m[0]) === 'string')
                    if (m[0].match(D.regImg))
                        set = {href: m[0]};
                    else
                        set = {html: m[0]};
            }
            else if ($.type(m) === 'string' && m.match(D.regImg))
                set = {href: m};
        }
        else if ($.type(m) === 'string')
            set = {'html': m};
        else if ($.type(m) === 'object')
            set = m;
        else
            throw 'insufficient data';
        return methods.open.call(null, $.extend(opt, set));
    };
    $.drop.nS = 'drop';
    $.drop.version = '1.0';
    $.drop.dP = {
        drop: null,
        href: null,
        hash: null,
        dropContent: '.drop-content',
        dropHeader: '.drop-header',
        dropFooter: '.drop-footer',
        placePaste: '.placePaste',
        header: null,
        footer: null,
        content: null,
        placeInherit: null,
        methodPlaceInherit: 'html',
        dropFilter: null,
        message: {
            success: function(text) {
                return '<div class= "drop-msg"><div class="drop-success"><span class="drop-icon-notify"></span><div class="drop-text-el">' + text + '</div></div></div>';
            },
            warning: function(text) {
                return '<div class= "drop-msg"><div class="drop-warning"><span class="drop-icon-notify"></span><div class="drop-text-el">' + text + '</div></div></div>';
            },
            error: function(text) {
                return '<div class="drop-msg"><div class="drop-error"><span class="drop-icon-notify"></span><div class="drop-text-el">' + text + '</div></div></div>';
            },
            info: function(text) {
                return '<div class="drop-msg"><div class="drop-info"><span class="drop-icon-notify"></span><div class="drop-text-el">' + text + '</div></div></div>';
            }
        },
        trigger: 'click',
        triggerOn: null,
        triggerOff: null,
        effectOn: 'fadeIn',
        effectOff: 'fadeOut',
        place: 'center',
        placement: 'left bottom',
        overlay: true,
        overlayColor: '#000',
        overlayOpacity: .6,
        position: 'absolute',
        placeBeforeShow: 'center center',
        placeAfterClose: 'center center',
        start: null,
        elBefore: $.noop,
        elAfter: $.noop,
        elClose: $.noop,
        elClosed: $.noop,
        before: $.noop,
        after: $.noop,
        close: $.noop,
        closed: $.noop,
        beforeG: $.noop,
        afterG: $.noop,
        closeG: $.noop,
        closedG: $.noop,
        pattern: '<div class="drop drop"><button type="button" class="drop-close" data-closed><span class="drop-icon-close">&#215;</span></button><button class="drop-prev" type="button" style="display: none;"><i class="drop-icon-prev"><</i>&#60;</button><button class="drop-next" type="button" style="display: none;"><i class="drop-icon-next">&#62;</i></button><div class="drop-header"></div><div class="drop-content"><div class="inside-padd placePaste"></div></div><div class="drop-footer"></div></div>',
        patternNotify: '<div class="drop drop-notify"><button type="button" class="drop-close" data-closed><span class="drop-icon-close">&#215;</span></button><button class="drop-prev" type="button" style="display: none;"><i class="drop-icon-prev">&#60;</i></button><button class="drop-next" type="button" style="display: none;"><i class="drop-icon-next">&#62;</i></button><div class="drop-header"></div><div class="drop-content"><div class="inside-padd placePaste"></div></div><div class="drop-footer"></div></div>',
        patternConfirm: '<div class="drop drop-confirm"><button type="button" class="drop-close" data-closed><span class="drop-icon-close">&#215;</span></button><button class="drop-prev" type="button" style="display: none;"><i class="drop-icon-prev">&#60;</i></button><button class="drop-next" type="button" style="display: none;"><i class="drop-icon-next">&#62;</i></button><div class="drop-header">Confirm</div><div class="drop-content"><div class="inside-padd"><div class="placePaste"></div><div class="drop-group-btns"><button type="button" class="drop-button-confirm" data-button-confirm>ok</button><button type="button" class="drop-btn-cancel" data-closed>cancel</button></div></div></div><div class="drop-footer"></div></div>',
        patternPrompt: '<div class="drop drop-prompt"><button type="button" class="drop-close" data-closed><span class="drop-icon-close">&#215;</span></button><button class="drop-prev" type="button" style="display: none;"><i class="drop-icon-prev">&#60;</i></button><button class="drop-next" type="button" style="display: none;"><i class="drop-icon-next">&#62;</i></button><div class="drop-header">Prompt</div><div class="drop-content"><form class="inside-padd"><div class="placePaste"></div><input type="text" name="promptInput"/><div class="drop-group-btns"><button data-button-prompt type="submit" class="drop-button-prompt">ok</button><button type="button" data-closed class="drop-btn-cancel">cancel</button></div></form></div><div class="drop-footer"></div></div>',
        patternAlert: '<div class="drop drop-alert"><button type="button" class="drop-close" data-closed><span class="drop-icon-close">&#215;</span></button><button class="drop-prev" type="button" style="display: none;"><i class="drop-icon-prev">&#60;</i></button><button class="drop-next" type="button" style="display: none;"><i class="drop-icon-next">&#62;</i></button><div class="drop-header">Alert</div><div class="drop-content"><div class="inside-padd"><div class="placePaste"></div><div class="drop-group-btns"><button type="button" class="drop-button-alert" data-button-alert>ok</button></div></div></div><div class="drop-footer"></div></div>',
        defaultClassBtnDrop: 'drop-',
        confirmActionBtn: '[data-button-confirm]',
        promptActionBtn: '[data-button-prompt]',
        alertActionBtn: '[data-button-alert]',
        dataPrompt: null,
        promptInput: '[name="promptInput"]',
        promptInputValue: null,
        exit: '[data-closed]',
        next: '.drop-next',
        prev: '.drop-prev',
        ajax: {
            type: 'post',
            dataType: null
        },
        jScrollPane: {
            animateScroll: true,
            showArrows: true
        },
        durationOn: 300,
        durationOff: 200,
        timeclosenotify: 3000,
        notify: false,
        datas: null,
        handleNotify: function(e, opt) {
            e = e.drp;
            if (!e || !e.datas)
                var text = 'Object notify is empty';
            else if (e.datas.answer === undefined || e.datas.data === undefined)
                text = 'Answer is empty';
            else if (!opt.message || !opt.message[e.datas.answer])
                text = e.datas.data;
            else
                text = opt.message[e.datas.answer](e.datas.data);
            $(e.drop).find(opt.placePaste).empty().append(text);
            return this;
        },
        confirm: false,
        confirmText: null,
        prompt: false,
        promptText: null,
        alert: false,
        alertText: null,
        always: false,
        animate: false,
        moreOne: false,
        closeClick: true,
        closeEsc: true,
        closeActiveClick: false,
        cycle: true,
        limitSize: false,
        droppable: false,
        droppableLimit: false,
        droppableFixed: false,
        inheritClose: true,
        keyNavigate: true,
        context: false,
        centerOnScroll: false,
        autoPlay: false,
        autoPlaySpeed: 2000,
        theme: 'default',
        type: 'auto',
        width: null,
        height: null,
        rel: null
    };
    $.drop.drp = {
        activeClass: 'drop-active',
        handleMessageWindow: function(e) {
            if (e.originalEvent.data)
                $.drop(e.originalEvent.data);
        },
        theme: {
            default: '.drop-header{background-color: #f8f8f8;padding: 0 55px 0 12px;font-size: 14px;}\n\
                    input, textarea{margin-bottom: 6px;}\n\
                    input, textarea, .drop-content button{outline: none;font-family: Arial, Helvetica CY, Nimbus Sans L, sans-serif;line-height: 1.5;border: 1px solid #d8d8d8;padding: 4px 6px;}\n\
                    button{background-color: #fafafa;box-shadow: inset 0 1px #fefefe;color: #666;cursor: pointer;}\n\
                    .drop-header.drop-no-empty, .drop-footer.drop-no-empty{padding-top: 6px;padding-bottom: 7px;}\n\
                    .drop-header.drop-no-empty{border-bottom: 1px solid #d8d8d8;}\n\
                    .drop-footer.drop-no-empty{border-top: 1px solid #d8d8d8;}\n\
                    .drop-content .inside-padd{padding: 12px 28px 12px 12px;}\n\
                    [[.drop-image .drop-content .inside-padd]], [[.drop-alert .drop-content .inside-padd]]{padding: 10px;}\n\
                    [[.drop-alert .drop-group-btns]]{text-align: center;}\n\
                    .drop-content button{margin-right: 4px;}{\n\
                    button:focus, input:focus, textarea:focus{outline: #b3b3b3 solid 1px;}\n\
                    .drop-footer{background-color: #d5d5d5;padding: 0 12px;}\n\
                    .drop-close, .drop-prev, .drop-next{outline: none;background: none;border: 0;cursor: pointer;vertical-align: middle;position: absolute;font-size: 0;}\n\
                    .drop-prev,.drop-next{width: 35%;height: 100%;top: 0;}\n\
                    .drop-icon-prev, .drop-icon-next{width: 20px;height: 80px;line-height: 80px;}\n\
                    .drop-icon-prev, .drop-icon-next, .drop-icon-close{font-family: "Trebuchet MS", "Helvetica CY", sans-serif;font-size: 21px;color: #999;background-color: #fff;display: inline-block;text-align: center;//display: inline;zoom: 1;}\n\
                    .drop-icon-close{line-height: 17px;width: 19px;height: 19px;}\n\
                    .drop-close{right: 5px;top: 4px;z-index: 1;}\n\
                    .drop-next{right: 5px;text-align: right;}\n\
                    .drop-prev{left: 5px;text-align: left;}\n\
                    .drop-icon-next{text-align: center;}\n\
                    .icon-times-drop{position: absolute;z-index:1;right:0;top: 0;cursor: pointer;width: 15px;height: 15px;}\n\
                    .nav{list-style: none;}\n\
                    .nav-vertical > li{display: block;border-top: 1px solid #ebebeb;padding: 8px 35px 8px 15px;}\n\
                    .nav-vertical > li > a{text-decoration: none;}\n\
                    .nav-vertical > li:first-child{border-top: 0;}\n\
                    .drop-msg > div{border-width: 1px;border-style: solid;padding: 10px;}\n\
                    .drop-success{background-color: #dff0d8;border-color: #d6e9c6;color: #3c763d;}\n\
                    .drop-warning{background-color: #fcf8e3;border-color: #faebcc;color: #8a6d3b;}\n\
                    .drop-error{background-color: #f2dede;border-color: #ebccd1;color: #a94442;}\n\
                    .drop-info{background-color: #d9edf7;border-color: #bce8f1;color: #31708f;}\n\
                    [[.drop-context .drop-content .inside-padd]]{padding: 0;}\n\
                    [drop][style*="width"] img{max-width: 100%;max-height: 100%;}\n\
                    [drop]{font-family: "Arial Black", "Helvetica CY", "Nimbus Sans L" sans-serif;font-size: 13px;color: #333;border: 1px solid #e4e4e4;background-color: #fff;}'
        },
        regImg: /(^data:image\/.*,)|(\.(jp(e|g|eg)|gif|png|bmp|webp|svg)((\?|#).*)?$)/i,
        reg: /[^a-zA-Z0-9]+/ig,
        autoPlayInterval: {},
        hashs: {},
        drops: {},
        galleries: {},
        gallerieOpt: {},
        galleryHashs: {
            _butRel: []
        },
        curAjax: {},
        aDS: '[data-elrun].drop-center:visible, [data-elrun].drop-global:visible',
        tempClass: 'drop-temp',
        wasCreateClass: 'drop-was-create',
        wLH: null,
        wLHN: null,
        scrollTop: null,
        emptyClass: 'drop-empty',
        noEmptyClass: 'drop-no-empty',
        pC: 'drop-',
        urlOfMethods: 'methods',
        notifyTimeout: {}
    };
    var D = $.drop.drp,
            DP = $.drop.dP;
    $.drop.setParameters = function(options) {
        $.extend(DP, options);
        return this;
    };
    $.drop.setThemes = function(options) {
        $.extend(D.theme, options);
        return this;
    };
    $.drop.methods = methods;
    $.drop.setUrlMethods = function(url) {
        D.urlOfMethods = url;
        return this;
    };
    $.drop.close = function(el) {
        return methods.close.call(el ? $(el) : null, 'artificial close element');
    };
    $.drop.cancel = function() {
        for (var i in D.curAjax)
            if (D.curAjax[i]) {
                D.curAjax[i].abort();
                D.curAjax[i] = null;
            }
        if (D.imgPreload)
            D.imgPreload.onload = D.imgPreload.onerror = null;
        $.drop.hideLoading();
        return this;
    };
    $.drop.update = function(el) {
        return (el ? $(el) : $('[data-elrun].' + D.activeClass)).each(function() {
            methods.update.call($(this));
        });
    };
    $.drop.next = function(rel) {
        return methods._checkMethod(function() {
            methods._galleriesDecorator(rel, 1);
        });
    };
    $.drop.prev = function(rel) {
        return methods._checkMethod(function() {
            methods._galleriesDecorator(rel, -1);
        });
    };
    $.drop.jumpto = function(i, rel) {
        return methods._checkMethod(function() {
            methods._galleriesDecorator(rel, null, i);
        });
    };
    $.drop.play = function(rel) {
        return methods._checkMethod(function() {
            methods._galleriesDecorator(rel, null, null);
        });
    };
    $.drop.require = function() {
        D.requireLength = arguments.length;
        for (var i in arguments) {
            D.requireCur = 0;
            (function(name) {
                $.ajax({
                    url: D.urlOfMethods + '/' + name + '.js',
                    dataType: 'script',
                    cache: true,
                    success: function() {
                        if (++D.requireCur === D.requireLength)
                            doc.trigger('require.' + $.drop.nS);
                    }
                });
            })(arguments[i]);
        }
        return this;
    };
    doc.ready(function() {
        var loadingTimer, loadingFrame = 1,
                loading = $('<div id="drop-loading"><div></div></div>').appendTo($('body'));
        var _animate_loading = function() {
            if (!loading.is(':visible')) {
                clearInterval(loadingTimer);
                return;
            }
            $('div', loading).css('top', (loadingFrame * -40) + 'px');
            loadingFrame = (loadingFrame + 1) % 12;
        };

        $.drop.showLoading = function() {
            clearInterval(loadingTimer);
            loading.show();
            loadingTimer = setInterval(_animate_loading, 66);
            return this;
        };
        $.drop.hideLoading = function() {
            loading.hide();
            return this;
        };
    });
    wnd.on('load.' + $.drop.nS, function() {
        setTimeout(function() {
            if (D.requireLength && D.requireCur !== D.requireLength)
                doc.on('require.' + $.drop.nS, function() {
                    $('[data-drop]').drop();
                });
            else
                $('[data-drop]').drop();
        }, 0);
    });
    wnd.on('message.' + $.drop.nS, D.handleMessageWindow);
})(jQuery, $(window), $(document));