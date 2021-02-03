
var Bot = require('./model.bot');
const receipt = require("../modules/receive/model.receipt");

class ReceiveBot extends Bot{     

    async answer(){

        //Content返回对话内容
        var returnData = { Status: 'complete', Content: '' }

        //根据不同的意图调用不同方法
        if("receiveByKey"==this.intentName){
            returnData = await receipt.receiveByAsnno(this.eventbody) 
        }else if("receiveBySku"==this.intentName){
            returnData = await receipt.receiveBySku(this.eventbody) 
        }else if("receiveByLot"==this.intentName){
            returnData = await receipt.receiveByLot(this.eventbody) 
        }
        
        return returnData
    }
}

module.exports = ReceiveBot;
