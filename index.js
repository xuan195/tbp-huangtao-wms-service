const userBase = require("./src/modules/base/userBase");
var BotFactory = require('./src/common/model.botfactory');
'use strict';
exports.main = async (event, context) => {
    console.log(event)
    //console.log(context)
    var para = JSON.parse(event.body)
    console.log(para)
    
    var intentName = para.IntentName  
    var uid = para.UserId;

    //返回格式为json格式{Status:'complete/error',Body:{},Content:xx}
    //Status是否成功:complete成功，error失败
    //Body传出数据
    //Content返回对话内容
    var returnData = {Status:'complete',Content:''}
    
    //功能方法先校验用于是否登录
    var userInfo = await userBase.findUserInfoByById(uid)
    var _warehouse = userInfo.warehouse
    
    if("loginUser"!=intentName&&"createUser"!=intentName&&""==_warehouse){
        returnData = {
            Status:'error',
            Body:{},
            Content:"请先登录"
        }
    }else{
        var bot = new BotFactory[intentName](intentName,para)
        returnData = await bot.answer()
    }

    console.log(returnData)
    var msg = {
        "RequestId":"xxx",
        "SessionAttributes":JSON.stringify(returnData),
        "ResponseMessage":{
        "ContentType":"PlainText",
        "Content":JSON.stringify(returnData.Content).replace('\"','').replace('\"','')
        }
    }

    return msg
};
