
var Bot = require('./model.bot');
const stock = require("../modules/inventory/model.stock");

class StockBot extends Bot {

    async answer() {

        //Content返回对话内容
        var returnData = { Status: 'complete', Content: '' }

        //根据不同的意图调用不同方法
        if ("queryStockBySku" == this.intentName) {
            returnData = await stock.queryStockBySku(this.eventbody)
        }      
          
        return returnData
    }
}

module.exports = StockBot;
