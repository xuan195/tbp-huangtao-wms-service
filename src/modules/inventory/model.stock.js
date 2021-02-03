const tools = require("../../utils/tools");
const stockBase = require("./stockBase");
const cloudbase = require("@cloudbase/node-sdk");
const userBase = require("../base/userBase");
const app = cloudbase.init({
    env: cloudbase.SYMBOL_CURRENT_ENV
});

const userInfo = app.auth().getUserInfo();
const db = app.database();
const _ = db.command

//根据物料返回库存信息
async function queryStockBySku(para) {
    var msg =''
    var status = 'complete'
    var _whseid  = ''//仓库编号
    var _storerKey = ''//货主编号
    var _warehouse = ''//仓库名称
      
     //用户编号
     var _userId = para.UserId;

    //获取物料编号
    var slotInfoList  = para.SlotInfoList
    var _sku = await tools.findSlotValue(slotInfoList,'sku')

    console.log("_userId:"+_userId+",_sku:"+_sku)
   
    //根据用户号获取默认仓库号、货主
    var userInfo  = await userBase.findUserInfoByById(_userId)
    var _whseid = userInfo.whseid
    var _storerKey = userInfo.storerKey
    var _warehouse= userInfo.warehouse
    
    var _body = {userId:_userId,storerKey:_storerKey,whseid:_whseid,warehouse:_warehouse,sku:_sku}

    //补充指定物料的库存信息
    var skustockInfo = await stockBase.findStockInfoByBySku(_whseid,_storerKey,_sku)

    Object.assign(_body, skustockInfo)   

    msg='库存信息如下：货品:'+_sku+',库存数量:'+skustockInfo.skuqty;

    var returnData = {
        Status:status,
        Body:_body,
        Content:msg
    }
    return returnData
}

module.exports.queryStockBySku=queryStockBySku;