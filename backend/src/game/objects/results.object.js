"use strict";
exports.__esModule = true;
exports.ResultsObject = void 0;
function getCurrentTime(date) {
    var day = ("0" + date.getDate()).slice(-2);
    var month = ("0" + (date.getMonth() + 1)).slice(-2);
    return (date.getFullYear() +
        "-" +
        month +
        "-" +
        day +
        " " +
        date.getHours() +
        ":" +
        date.getMinutes() +
        ":" +
        date.getSeconds());
}
var ResultsObject = /** @class */ (function () {
    function ResultsObject(player1, player2) {
        var date = new Date();
        this.player1 = player1;
        this.player2 = player2;
        this.date = getCurrentTime(date);
    }
    return ResultsObject;
}());
exports.ResultsObject = ResultsObject;
