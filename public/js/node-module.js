var moduleer = function (options) {
    var modules = [];
    options = options || {};
    var lipre = options.lipre || "";
    var lipost = options.lipost || "";

    var moduleList = $("ul#add-flow-node-module");
    var originalModules = [];


    function formatModule(module) {
        return lipre.replace(/@@MODULE@@/g, module) + module + lipost.replace(/@@MODULE@@/g, module);
    }

    $("li", moduleList).each(function (i, e) {
        var li = $(e);
        var module = li.attr("module");
        li.html(module + ' <a href="#"><i class="icon icon-remove"></i></a>');
        $("a", li).click(function (e) {
            removeModule(module);
            e.preventDefault();
        });
        modules.push(module);
        originalModules.push(module);
    });

    var listInput = $('<li class="module-input"><input id="add-flow-modules-input" type="text"></input></li>');
    moduleList.append(listInput);

    var moduleInput = $("#add-flow-modules-input");
    moduleList.click(function (e) {
        moduleInput.focus();
    });
    moduleInput.on('focusin', function (e) {
        moduleList.addClass("active");
    });
    moduleInput.on('focusout', function (e) {
        moduleList.removeClass("active");
        var val = moduleInput.val();
        if (val != "") {
            addModule(val);
            moduleInput.val("");
        }
    });

    moduleInput.on('keydown', function (e) {
        if (e.which == 32 || (e.which == 188 && !e.shiftKey)) {
            var val = moduleInput.val();
            if (val != "") {
                if (addModule(val)) {
                    moduleInput.val("");
                }
            }
            e.preventDefault();
        } else if (e.which == 8) {
            var val = moduleInput.val();
            if (val == "") {
                var prevModule = $(this).parent().prev().attr("module");
                if (prevModule) {
                    removeModule(prevModule);
                }
                e.preventDefault();
            }
        }
    });

    function strip() {
        $("li", moduleList).each(function (i, e) {
            var li = $(e);
            if (li.hasClass("module-input")) {
                li.remove();
            } else {
                var module = $(li).attr("module");
                li.html(formatModule(module));
            }
        });
    }

    function cancel() {
        $("li", moduleList).remove();
        modules = originalModules;
        for (var i in modules) {
            moduleList.append($("<li>").html(formatModule(modules[i])).attr("module", modules[i]));
        }
    }
    function addModule(module) {
        module = module.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        var i = $.inArray(module, modules);
        if (i == -1) {
            modules.push(module);

            var newmodule = $("<li>").html(module + ' <a href="#"><i class="icon icon-remove"></i></a>');
            $(newmodule).attr("module", module);
            $("a", newmodule).click(function (e) {
                removeModule(module);
                e.preventDefault();
            });
            moduleInput.parent().before(newmodule);
            return true;
        } else {
            var existingModule = $("li[module='" + module + "']", moduleList);
            existingModule.css({ borderColor: '#f00', background: '#fcc' });
            window.setTimeout(function () {
                existingModule.css({ borderColor: '#ccc', background: '#f5f5f5' });
            }, 1000);
            return false;
        }
    }
    function removeModule(module) {
        var i = $.inArray(module, modules);
        if (i != -1) {
            modules.splice(i, 1);

            $("li", moduleList).each(function (i, e) {
                if ($(e).attr("module") == module) {
                    e.remove();
                }
            });
        }
    }
    return {
        add: addModule,
        remove: removeModule,
        get: function () { return modules },
        strip: strip,
        cancel: cancel
    };
}
