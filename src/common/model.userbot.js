
var Bot = require('./model.bot');
const user = require("../modules/base/model.user");

class UserBot extends Bot{     

    async answer(){
        
        //Content返回对话内容
        var returnData = { Status: 'complete', Content: '' }

        //根据不同的意图调用不同方法
        if("createUser"==this.intentName){
            returnData = await user.createUser(this.eventbody)
        }else if("loginUser"==this.intentName){
            returnData = await user.loginUser(this.eventbody)
        }
        
        return returnData
    }
}

module.exports = UserBot;
