const tools = require("../../utils/tools");
const stockBase = require("../inventory/stockBase");
const userBase = require("../base/userBase");
const ordersBase = require("./ordersBase");
const pickdetailBase = require("./pickdetailBase");

const cloudbase = require("@cloudbase/node-sdk");
const app = cloudbase.init({
    env: cloudbase.SYMBOL_CURRENT_ENV
});

const userInfo = app.auth().getUserInfo();
const db = app.database();
const _ = db.command

//无出库单按货品发货
async function deliveryBySku(para) {
    var msg = ''
    var status = 'complete'

    var _userId = para.UserId;
    //根据用户号获取默认仓库号、货主
    var userInfo = await userBase.findUserInfoByById(_userId)
    var _whseid = userInfo.whseid
    var _storerKey = userInfo.storerKey
    var _warehouse = userInfo.warehouse

    //获取单号信息
    var slotInfoList = para.SlotInfoList
    var _sku = await tools.findSlotValue(slotInfoList, 'sku')
    var _pickQty = Number(await tools.findSlotValue(slotInfoList, 'pickQty'))
    console.log("_whseid:" + _whseid + ",_storerKey:" + _storerKey + ",_sku:" + _sku + ",userid:" + _userId + ',_pickQty' + _pickQty)

    //根据货品创建收货单
    var _options = {
        userId: _userId,
        sku: _sku,
        whseid: _whseid,
        storerKey: _storerKey,
        pickQty: _pickQty
    }
    var _orderKey = await ordersBase.addOrdersBySku(_options, {})

    //调用收货API
    //拼装参数
    var deliveryPara = {
        'userId': _userId,
        'whseid': _whseid,
        'orderKey': _orderKey,
        'pickQty': ''
    }
    //调用发货API
    var deliveryData = await deliveryBase(deliveryPara)

    if(deliveryData.Status !='complete'){
        return deliveryData
    }
    msg = '物料发货成功，物料名称：'+_sku+' 本次发货数量'+_pickQty

    var _body = { userId: _userId, whseid: _whseid, warehouse: _warehouse, sku: _sku }
    //补充库存库存信息，物料种类和库存数量
    var stockInfo = await stockBase.findStockInfoByById(_whseid, _storerKey)

    Object.assign(_body, stockInfo)

    //补充指定物料的库存信息
    var skustockInfo = await stockBase.findStockInfoByBySku(_whseid, _storerKey, _sku)

    Object.assign(_body, skustockInfo)

    var returnData = {
        Status: status,
        Body: _body,
        Content: msg
    }
    return returnData
}

//按单号发货
async function deliveryByOrderKeyo(para) {
    var msg = ''
    var status = 'complete'

    var _userId = para.UserId;
    //根据用户号获取默认仓库号
    var userInfo = await userBase.findUserInfoByById(_userId)
    var _whseid = userInfo.whseid
    var _storerKey = userInfo.storerKey
    var _warehouse = userInfo.warehouse

    //获取单号信息
    var slotInfoList = para.SlotInfoList
    var _orderKey = await tools.findSlotValue(slotInfoList, 'orderKey')
    var _pickQty = await tools.findSlotValue(slotInfoList, 'pickQty')
    if (_pickQty != '') {
        _pickQty = Number(_pickQty)
    }
    console.log("_orderKey:" + _orderKey + ",_pickQty:" + _pickQty)

     //调用收货API
    //拼装参数
    var deliveryPara = {
        'userId': _userId,
        'whseid': _whseid,
        'orderKey': _orderKey,
        'pickQty': _pickQty
    }
    //调用收货API
    var deliveryData = await deliveryBase(deliveryPara)

    if(deliveryData.Status =='error'){
        return deliveryData
    }

    msg = '订单发运成功：订单号：'+_orderKey

    var _body = { userId: _userId, whseid: _whseid, warehouse: _warehouse,orderKey:_orderKey}
    //补充库存库存信息，物料种类和库存数量
    var stockInfo = await stockBase.findStockInfoByById(_whseid, _storerKey)

    Object.assign(_body, stockInfo)

    var returnData = {
        Status: status,
        Body: _body,
        Content: msg
    }
    console.log(returnData)
    return returnData
}

//发货API
async function deliveryBase(para) {
    var msg = ''
    var status = 'complete'

    console.log(para)
    var _userId = para.userId //用户id
    var _whseid = para.whseid//仓库号
    var _orderKey  = para.orderKey //收货单号
    var _pickQty = para.pickQty //收货数量

    //创建此次操作的波次号
    var _waveKey = await tools.randomNumber();
    var _caseid = await tools.randomNumber();

    //调用分配API根据订单需分配量匹配库存量，将库存分配给订单，且创建拣货明细
    var allocationData = await allocation({
        'userId': _userId,
        'whseid': _whseid,
        'orderKey': _orderKey,
        'pickQty': _pickQty,
        'waveKey': _waveKey,
        'caseid': _caseid
    })
    
    console.log('allocationData')
    console.log(allocationData)
    if(allocationData.Status !='complete'){
        return allocationData
    }

    //调用发运API将拣货明细发运
    var shippingData = await shipping({
        'userId': _userId,
        'whseid': _whseid,
        'orderKey': _orderKey,
        'caseid': _caseid
    })

    console.log('shippingData')
    console.log(shippingData)
    if(shippingData.Status !='complete'){
        return shippingData
    }   

    var returnData = {
        Status: status,
        Body: {},
        Content: msg
    }
    console.log(returnData)
    return returnData
}

/**
 * 订单分配API根据订单号或者分配数量
 * @param {userId:xx,whseid:xx,orderKey:xx,pickQty:xx,waveKey:xx,caseid:xx} para 
 */
async function allocation(para) {
    console.log("allocation start")
    var status = 'complete'
    var msg = ''

    console.log(para)
    var _userId = para.userId //用户id
    var _whseid = para.whseid//仓库号
    var _orderKey = para.orderKey //出库单号
    var _pickQty = para.pickQty //分配数量

    //根据收货单号查询单据信息
    var ordersInfo = await db.collection('orders')
        .where({
            whseid: _whseid,
            orderKey: _orderKey
        })
        .get()
    console.log("ordersInfo")
    console.log(ordersInfo)
    if (ordersInfo.data[0]) {
        var _storerKey = ordersInfo.data[0].storerKey//货主     
        var _sku = ordersInfo.data[0].sku//货品编码      
        var _openqty = ordersInfo.data[0].openqty//未结数量
        var _qtyallocated = ordersInfo.data[0].qtyallocated//分配数量
        var _qtypicked = ordersInfo.data[0].qtypicked//拣货数量
        var _shippedqty = ordersInfo.data[0].shippedqty//发运数量
        var _orderNeedAllocatedQty = 0 //订单剩余需分配数量
        if (_openqty - _qtyallocated - _qtypicked - _shippedqty > 0) {
            _orderNeedAllocatedQty = _openqty - _qtyallocated - _qtypicked - _shippedqty
        }
        _lpn = ordersInfo.data[0].lpn?ordersInfo.data[0].lpn:''//指定发货箱号

        var _needAllocatedQty = _pickQty != '' ? _pickQty : _orderNeedAllocatedQty
        console.log("_needAllocatedQty" + _needAllocatedQty)
        console.log("_orderNeedAllocatedQty" + _orderNeedAllocatedQty)
        console.log("_pickQty" + _pickQty)

        //如果需要分配数量为0无需分配
        if (_needAllocatedQty > 0) {
            //拼接库存查询参数
            var alstdparms = {
                whseid: _whseid,
                storerKey: _storerKey,
                sku: _sku,
                lpn: _lpn
            }
            //查询库存记录是否存在，如果存在增加库存数量，如果不存在新增库存记录
            var alstdlist = await stockBase.findStockInfoByAllocation(alstdparms)

            //校验可以库存数是否满足此次需要出库数量
            //总可用库存数
            var qtyavailableTotal = 0;
            for (var i = 0; i < alstdlist.length && qtyavailableTotal < _needAllocatedQty >= 0; i++) {
                var stocktem = alstdlist[i]
                var temqtyavailable = stocktem.qtyavailable //可用库存数量
                qtyavailableTotal = qtyavailableTotal + temqtyavailable
            }
            if (qtyavailableTotal < _needAllocatedQty) {
                status = 'error'
                msg = '可用库存小于此次需拣货数量'
            } else {
                await handleAllocation(para,alstdlist,_needAllocatedQty)           
            }

        } else {
            //status = 'error'
            //msg = '需分配数量必须大于零'
        }
    } else {
        status = 'error'
        msg = '出货单号不存在'
    }

    var _body = { userId: _userId, storerKey: _storerKey, whseid: _whseid, orderKey: _orderKey, sku: _sku }

    var returnData = {
        Status: status,
        Body: _body,
        Content: msg
    }
    return returnData
}


//执行分配讲逻辑，增加库存分配数量和订单分配数量
async function handleAllocation(para,alstdlist,_needAllocatedQty) {
    var msg = ''

    var _userId = para.userId //用户id
    var _whseid = para.whseid//仓库号
    var _orderKey = para.orderKey //出库单号
    var _waveKey = para.waveKey//波次号
    var _caseid = para.caseid//箱序号

    for (var i = 0; i < alstdlist.length && _needAllocatedQty > 0; i++) {
        var stocktem = alstdlist[i]
        var temstorerKey= stocktem.storerKey
        var temsku = stocktem.sku
        var temloc = stocktem.loc
        var temlpn = stocktem.lpn
        var temlot = stocktem.lot
        var temqtyavailable = stocktem.qtyavailable //可用库存数量
        var temId = stocktem._id
        var allocqty = _needAllocatedQty > temqtyavailable ? temqtyavailable : _needAllocatedQty //本次分配数量

        //创建拣货明细
        var pickdetailOptions = {
            userId: _userId,
            whseid: _whseid,
            storerKey: temstorerKey,
            sku: temsku,
            orderKey: _orderKey,
            pickQty: allocqty,
            loc: temloc,
            waveKey: _waveKey,
            caseid: _caseid
        }
        await pickdetailBase.addPickdetail(pickdetailOptions, { lpn: temlpn, lot: temlot });

        //修改库存记录的分配数量和可用数量
        await db.collection('lotxlocxlpn').doc(temId)
            .update({
                qtyallocated: _.inc(allocqty),
                qtyavailable: _.inc(-allocqty)
            })
            .then(res => {
                console.log(res)
            })

        //更新订单表状态和数量
        await db.collection('orders')
            .where({
                orderKey: _orderKey,
                whseid: _whseid
            })
            .update({
                status: 20,
                qtyallocated:_.inc(allocqty),
                updateWho: _userId
            })
            .then(res => {
                console.log(res)
            })

        _needAllocatedQty = _needAllocatedQty - allocqty
    }

    return msg
}


/**
 * 订单发运API,根据订单号或者箱序号发运
 * @param {userId:xx,whseid:xx,orderKey:xx,caseid:xx} para 
 */
async function shipping(para) {
    console.log("shipping start")
    var status = 'complete'
    var msg = ''

    console.log(para)
    var _userId = para.userId //用户id
    var _whseid = para.whseid//仓库号
    var _orderKey = para.orderKey //出库单号
    var _caseid = para.caseid ? para.caseid : ''//箱序号

    //根据收货单号查询单据信息
    var pickdteailWhere = { whseid: _whseid, orderKey: _orderKey, status: _.lt(9) }
    if (_caseid != '') {
        pickdteailWhere.caseid = _caseid
    }
    var pickdetailInfo = await db.collection('pickdetail')
        .where(pickdteailWhere)
        .get()
    console.log("pickdetailInfo")
    console.log(pickdetailInfo)

    if (pickdetailInfo.data[0]) {

        for (var i = 0; i < pickdetailInfo.data.length; i++) {
            var stocktem = pickdetailInfo.data[i]
            var _storerKey = stocktem.storerKey//货主
            var _sku = stocktem.sku//货品
            var _status = stocktem.status//状态
            var _pickQty = stocktem.qty//拣货数量

            //拣货明细状态：0新建，1发放，5已拣货，9发运
            //如果拣货明细状态为0或者为1，调用拣货前发运方法，此时库存没有拣货数量，需扣减分配数量
            //如果拣货明细状态为5,调用拣货后发运方法，此时库存有拣货数量，需扣减拣货数量        
            if (_pickQty > 0) {
                //如果拣货明细状态为0或者为1，调用拣货前发运方法，此时库存没有拣货数量，需扣减分配数量
                if (_status < 5) {                    
                    await handleShippingByAlloc(stocktem,_userId)
                } else if (_status > 5 && _status != 9) {
                    await handleShippingByPick(stocktem,_userId)
                }
            }
        }
    } else {
        status = 'error'
        msg = '没有要发运的拣货明细'
    }

    var _body = { userId: _userId, storerKey: _storerKey, whseid: _whseid, orderKey: _orderKey, sku: _sku }

    var returnData = {
        Status: status,
        Body: _body,
        Content: msg
    }
    return returnData
}

//调用拣货前发运方法，此时库存没有拣货数量，需扣减分配数量
async function handleShippingByAlloc(pickdetail,_userId) {
    console.log('handleShippingByAlloc')
    var status = 'complete'
    var msg = ''

    var _whseid = pickdetail.whseid//仓库号
    var _pickdetailKey = pickdetail.pickdetailKey//拣货单号
    var _orderKey = pickdetail.orderKey//订单号
    var _storerKey = pickdetail.storerKey//货主
    var _sku = pickdetail.sku//货品
    var _status = pickdetail.status//状态
    var _pickQty = pickdetail.qty//拣货数量
    var _loc = pickdetail.loc//拣货库位
    var _lpn = pickdetail.lpn//拣货箱号
    var _lot = pickdetail.lot//拣货批次

    //更新库存表数量
    var lotxlocxlpnInfo = await db.collection('lotxlocxlpn')
    .where({
        whseid: _whseid,
        storerKey: _storerKey,
        sku: _sku,
        loc: _loc,
        lpn: _lpn,
        lot: _lot,
        qtyallocated: _.gte(_pickQty)
    })
    .get();

    if (lotxlocxlpnInfo.data[0]) {
        var stocktem = lotxlocxlpnInfo.data[0]
        console.log(stocktem)
        //扣减库存记录的现有数量、分配数量、可用数量
        await db.collection('lotxlocxlpn').doc(stocktem._id)
            .update({
                qty: _.inc(-_pickQty),
                qtyallocated: _.inc(-_pickQty),                
                updateWho: _userId
            })
            .then(res => {
                console.log(res)
            })

    } else {
        status = 'error'
        msg = '库存分配数不满足拣货明细拣货数量：拣货明细' + _pickdetailKey
    }

    //跟新拣货明细表状态               
    if (status != 'error') {
        await db.collection('pickdetail')
            .where({
                pickdetailKey: _pickdetailKey
            })
            .update({
                status: 9,
                updateWho: _userId
            })
            .then(res => {
                console.log(res)
            })

        //更新订单表状态和数量
        await db.collection('orders')
            .where({
                orderKey: _orderKey,
                whseid: _whseid
            })
            .update({
                status: 90,
                openqty:_.inc(-_pickQty),
                qtyallocated:_.inc(-_pickQty),            
                shippedqty:_.inc(_pickQty),
                updateWho: _userId,
                updateTime:new Date(),
                actualshipDate:new Date()
            })
            .then(res => {
                console.log(res)
            })
    }

    var returnData = {
        Status: status,
        Body: {},
        Content: msg
    }
    return returnData
}

//调用拣货后发运方法，此时库存有拣货数量，需扣减拣货数量
async function handleShippingByPick(pickdetail,_userId) {
    console.log('handleShippingByPick')
    var status = 'complete'
    var msg = ''

    var _whseid = pickdetail.whseid//仓库号
    var _pickdetailKey = pickdetail.pickdetailKey//拣货单号
    var _orderKey = pickdetail.orderKey//订单号
    var _storerKey = pickdetail.storerKey//货主
    var _sku = pickdetail.sku//货品
    var _status = pickdetail.status//状态
    var _pickQty = pickdetail.qty//拣货数量
    var _loc = pickdetail.loc//拣货库位
    var _lpn = pickdetail.lpn//拣货箱号
    var _lot = pickdetail.lot//拣货批次

    //更新库存表数量
    var lotxlocxlpnInfo = await db.collection('lotxlocxlpn')
    .where({
        whseid: _whseid,
        storerKey: _storerKey,
        sku: _sku,
        loc: _loc,
        lpn: _lpn,
        lot: _lot,
        qtypicked: _.gt(_pickQty)
    })
    .get();

    if (lotxlocxlpnInfo.data[0]) {
        var stocktem = lotxlocxlpnInfo.data[0]
        console.log(stocktem)
        //扣减库存记录的现有数量、分配数量、可用数量
        await db.collection('lotxlocxlpn').doc(stocktem._id)
            .update({
                qty: _.inc(-_pickQty),
                qtypicked: _.inc(-_pickQty),
                updateWho: _userId
            })
            .then(res => {
                console.log(res)
            })

    } else {
        status = 'error'
        msg = '库存拣货数不满足拣货明细拣货数量：拣货明细' + _pickdetailKey
    }

    //跟新拣货明细表状态               
    if (status != 'error') {
        await db.collection('pickdetail')
            .where({
                pickdetailKey: _pickdetailKey
            })
            .update({
                status: 9,
                updateWho: _userId
            })
            .then(res => {
                console.log(res)
            })

        //更新订单表状态和数量
        await db.collection('orders')
            .where({
                orderKey: _orderKey,
                whseid: _whseid
            })
            .update({
                status: 90,
                openqty:_.inc(-_pickQty),
                qtypicked:_.inc(-_pickQty),            
                shippedqty:_.inc(_pickQty),
                updateWho: _userId,
                updateTime:new Date(),
                actualshipDate:new Date()
            })
            .then(res => {
                console.log(res)
            })
    }

    var returnData = {
        Status: status,
        Body: {},
        Content: msg
    }
    return returnData
}


module.exports.deliveryBySku = deliveryBySku;
module.exports.deliveryByOrderKeyo = deliveryByOrderKeyo;