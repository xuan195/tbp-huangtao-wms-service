
var Bot = require('./model.bot');
const user = require("../modules/base/model.lottable");

class LottableBot extends Bot{     

    async answer(){
        
        //Content返回对话内容
        var returnData = { Status: 'complete', Content: '' }

        //根据不同的意图调用不同方法
        if("createLottable"==this.intentName){
            returnData = await user.createLottable(this.eventbody)
        }
        
        return returnData
    }
}

module.exports = LottableBot;
