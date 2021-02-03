
var Bot = require('./model.bot');
const orders = require("../modules/delivery/model.orders");

class DeliveryBot extends Bot{     

    async answer(){

        //Content返回对话内容
        var returnData = { Status: 'complete', Content: '' }

        //根据不同的意图调用不同方法
        if("deliveryBySku"==this.intentName){
            returnData = await orders.deliveryBySku(this.eventbody)
        }else if("deliveryByOrderKeyo"==this.intentName){
            returnData = await orders.deliveryByOrderKeyo(this.eventbody)
        }
        
        return returnData
    }
}

module.exports = DeliveryBot;
