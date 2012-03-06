(function () {

    "use strict";

    var fluid = require("infusion"),
        uuid = require("node-uuid"),
        gpii = fluid.registerNamespace("gpii");

    fluid.require("../../../../../shared/dataSource.js");
    fluid.require("../../../../../shared/utils.js");

    fluid.defaults("gpii.source", {
        gradeNames: ["autoInit", "fluid.littleComponent"],
        mergePolicy: {
            server: "nomerge"
        },
        components: {
            dataSource: {
                type: "gpii.dataSource",
                options: {
                    writable: "{gpii.source}.options.writable",
                    termMap: "{gpii.source}.options.termMap"
                }
            }
        },
        invokers: {
            all: "gpii.source.all",
            get: "gpii.source.get"
        },
        generator: "id",
        writable: false,
        preInitFunction: "gpii.source.preInit",
        finalInitFunction: "gpii.source.finalInit"
    });

    gpii.source.preInit = function (that) {
        if (that.options.writable) {
            that.options.invokers.post = "gpii.source.post";
        }
        that.options.termMap = gpii.pathToTermMap(that.options.path);
        that.server = that.options.server;
    };

    gpii.source.finalInit = function (that) {
        fluid.each(that.options.invokers, function (invoker, name) {
            that.server[name](that.options.path, that[name]);
        });
    };

    gpii.source.all = function (options, req, res, next) {
        var generator = options.generator;

        req.directModel = {};
        fluid.each(options.termMap, function (term, key) {
            req.directModel[key] = req.params[key];
        });
        // TODO: Think of the better approach.
        if (req.method === "POST" && generator) {
            req.directModel[generator] = req.directModel[generator] || uuid.v4();
        }
        next();
    };

    gpii.source.get = function (dataSource, req, res) {
        dataSource.get(req.directModel, gpii.source.makeCallback(res));
    };

    gpii.source.post = function (dataSource, req, res) {
        dataSource.set(req.directModel, req.body, gpii.source.makeCallback(res));
    };

    gpii.source.makeCallback = function (res) {
        return function (resp) {
            if (!resp || resp && resp.isError) {
                res.send(resp.message, 404);
                return;
            }
            res.send(resp, 200);
        };
    };

    fluid.demands("gpii.source.all", "gpii.source", {
        funcName: "gpii.source.all",
        args: ["{gpii.source}.options", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
    });

    fluid.demands("gpii.source.get", "gpii.source", {
        funcName: "gpii.source.get",
        args: ["{dataSource}", "{arguments}.0", "{arguments}.1"]
    });

    fluid.demands("gpii.source.post", "gpii.source", {
        funcName: "gpii.source.post",
        args: ["{dataSource}", "{arguments}.0", "{arguments}.1"]
    });

})();