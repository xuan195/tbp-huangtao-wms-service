const tools = require("../../utils/tools");
const cloudbase = require("@cloudbase/node-sdk");
const app = cloudbase.init({
    env: cloudbase.SYMBOL_CURRENT_ENV
});

const userInfo = app.auth().getUserInfo();
const db = app.database();
const _ = db.command

//创建Asn单据,options:{userId:xxx,sku:xxx,whseid:_whseid,storerKey:_storerKey,receiptQty:xxx}
async function addReceiptBySku(options,receiptExtend) {
    var msg =''
    var uid = options.userId;     
      
    //获取单号信息    
    var _sku = options.sku
    var _receiptQty = options.receiptQty    
    var _whseid = options.whseid
    var _storerKey = options.storerKey

    var _receiptKey = await tools.randomNumber()
    //根据货品创建收货单
    var receiptInfo = {
        whseid:_whseid,
        receiptKey:_receiptKey,
        storerKey:_storerKey,     
        type:1,
        expectedReceiptDate:new Date(),
        status:0,
        sku:_sku,
        toId:' ',
        qtyexpected:_receiptQty,
        qtyreceived:0,
        toLoc:'STAGE',
        toLot:' '
    }

    Object.assign(receiptInfo, receiptExtend)   

    await db.collection('receipt').add(receiptInfo)
    .then(res => {
        console.log(res)
        msg = _receiptKey
    })

    return msg
}

module.exports.addReceiptBySku=addReceiptBySku;
