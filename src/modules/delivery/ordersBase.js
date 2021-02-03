const tools = require("../../utils/tools");
const cloudbase = require("@cloudbase/node-sdk");
const app = cloudbase.init({
    env: cloudbase.SYMBOL_CURRENT_ENV
});

const userInfo = app.auth().getUserInfo();
const db = app.database();
const _ = db.command

//创建出库单据,options:{userId:xxx,sku:xxx,whseid:_whseid,storerKey:_storerKey,pickQty:xxx}
async function addOrdersBySku(options, extend) {
    var msg = ''
    var _userId = options.userId;

    //获取单号信息    
    var _sku = options.sku
    var _pickQty = options.pickQty
    var _whseid = options.whseid
    var _storerKey = options.storerKey

    var _orderKey = await tools.randomNumber()
    //根据货品创建收货单
    var ordersInfo = {
        whseid: _whseid,
        orderKey: _orderKey,
        storerKey: _storerKey,
        type: 1,
        requestedshipDate: new Date(),
        status: 0,
        sku: _sku,
        originalqty: _pickQty,
        openqty:_pickQty,
        qtyallocated: 0,
        qtypicked: 0,
        shippedqty: 0,        
        createWho: _userId,
        createTime:new Date()
    }

    Object.assign(ordersInfo, extend)

    await db.collection('orders').add(ordersInfo)
        .then(res => {
            console.log(res)
            msg = _orderKey
        })

    return msg
}

module.exports.addOrdersBySku = addOrdersBySku;
