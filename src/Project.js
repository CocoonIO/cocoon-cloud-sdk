var CocoonSDK;
(function (CocoonSDK) {
    (function (Status) {
        Status[Status["Waiting"] = "waiting"] = "Waiting";
        Status[Status["Compiling"] = "compiling"] = "Compiling";
        Status[Status["Completed"] = "completed"] = "Completed";
    })(CocoonSDK.Status || (CocoonSDK.Status = {}));
    var Status = CocoonSDK.Status;
    var Compilation = (function () {
        function Compilation(platform, data) {
            this.platfom = platform;
            this.data = data;
        }
        return Compilation;
    })();
    CocoonSDK.Compilation = Compilation;
})(CocoonSDK || (CocoonSDK = {}));
var Project = (function () {
    function Project(data) {
        this.data = data;
    }
    return Project;
})();
exports.Project = Project;
//# sourceMappingURL=Project.js.map