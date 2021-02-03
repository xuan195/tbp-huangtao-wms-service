const tools = require("../../utils/tools");
const cloudbase = require("@cloudbase/node-sdk");
const app = cloudbase.init({
    env: cloudbase.SYMBOL_CURRENT_ENV
});

const userInfo = app.auth().getUserInfo();
const db = app.database();
const _ = db.command


//根据仓库号货主查询库存信息
async function findStockInfoByById(_whseid,_storerKey) {

    console.log("根据仓库号货主查询库存信息"+_whseid+","+_storerKey)

    var _skuNum = 0;//仓库货主下物料种类
    var _qtyTotal = 0.0//库仓库货主下存总数量
             
    const $ = db.command.aggregate //获取聚合方法组对象
    var skunumInfo = await db.collection('lotxlocxlpn')    
    .aggregate()//进行聚合查询     
    .match({
        whseid:_whseid,
        storerKey:_storerKey
    })
    .group({//分组设定
        _id: '$sku',// 按 sku 字段分组
        sumPeople: $.sum(1)//统计总数量
    }).count('skuNum')
    .end()//结束聚合返回结果 
    //{ requestId: '1744f64582c_1', data: [ { skuNum: 2 } ] }
    console.log("分组查询编码种类")
    console.log(skunumInfo)
    if(skunumInfo.data[0]){
        _skuNum = skunumInfo.data[0].skuNum
    }

    var qtytotalInfo = await db.collection('lotxlocxlpn')    
    .aggregate()//进行聚合查询     
    .match({
        whseid:_whseid,
        storerKey:_storerKey
    })
    .group({//分组设定
        _id: '',// 不分组
        qtyTotal:$.sum('$qty')//统计总数量
    })
    .end()//结束聚合返回结果 
    // { requestId: '1745164a1a0_1',data: [ { _id: '', sumPeople: 3, qtyTotal: 50 } ] }
    console.log("分组查询总库存数")
    console.log(qtytotalInfo)
    if(qtytotalInfo.data[0]){
        _qtyTotal = qtytotalInfo.data[0].qtyTotal
    }
 
    var returnData = {
        skuNum : _skuNum,
        qtyTotal : _qtyTotal
    }
    console.log(returnData)
    return returnData
}

async function findStockInfoByBySku(_whseid,_storerKey,_sku) {

    var _loc = '无'; //库位
    var _skulpn = '无'; //箱号
    var _skuqty = 0.0; //库存量
    var _qtypick = 0.0; //拣货量
    var _qtyallocated = 0.0; //分配量
    var _qtyonhold = 0.0; //冻结量
    var _qtyavailable = 0.0; //可用量    
    var _lotcode = ''; //可用量    
    console.log('根据仓库号、货主、物料查询库存信息,_whseid'+_whseid+',_storerKey'+_storerKey+'_sku'+_sku)

    const $ = db.command.aggregate //获取聚合方法组对象
    var qtytotalInfo = await db.collection('lotxlocxlpn')
    .aggregate()//进行聚合查询   
    .match({
        whseid:_whseid,
        storerKey:_storerKey,
        sku:_sku
    })    
    .lookup({
        from: 'lotattribute',
        localField: 'lot',
        foreignField: 'lot',
        as: 'lotattribute',
    })
    .group({//分组设定
        _id: {
            skuloc: '$loc',
            skulpn: '$lpn'
            // ,lotcode: '$lotattribute.lottables.lottable01'
        },// 不分组
        skuqty:$.sum('$qty'),//统计库存量
        skuqtypick:$.sum('$qtypick'),//统计拣货量
        skuqtyallocated:$.sum('$qtyallocated'),//统计分配量
        skuqtyonhold:$.sum('$qtyonhold'),//统计冻结量
        skuloc:$.max('$loc'),//库位
        skulpn:$.max('$lpn'),//箱号
        lotcode:$.max('$lotattribute.lottables.lottable01')//批次
        
    })
    .end()//结束聚合返回结果     
    console.log("分组查询编码库存信息")
    console.log(JSON.stringify(qtytotalInfo))

    if(qtytotalInfo.data[0]){
        _skuqty = qtytotalInfo.data[0].skuqty //库存量
        _qtypick = qtytotalInfo.data[0].skuqtypick; //拣货量
        _qtyallocated = qtytotalInfo.data[0].skuqtyallocated; //分配量
        _qtyonhold = qtytotalInfo.data[0].skuqtyonhold; //冻结量
        _qtyavailable = _skuqty - _qtypick - _qtyallocated - _qtyonhold; //可用量
        _loc = qtytotalInfo.data[0].skuloc; //库位
        _skulpn = qtytotalInfo.data[0].skulpn;//箱号
        _lotcode = qtytotalInfo.data[0].lotcode;//箱号
    }

    var returnData = {
        sku:_sku,
        skuqty : _skuqty,
        qtypick : _qtypick,
        qtyallocated : _qtyallocated,
        qtyonhold : _qtyonhold,
        qtyavailable : _qtyavailable,
        loc : _loc,
        skulpn : _skulpn,
        lotcode : _lotcode
    }
    console.log(returnData)
    return returnData
}

//根据仓库号、货主、物料查询库存信息
async function findStockInfoByBySkuBK(_whseid,_storerKey,_sku) {

    var _loc = '无'; //库位
    var _skulpn = '无'; //箱号
    var _skuqty = 0.0; //库存量
    var _qtypick = 0.0; //拣货量
    var _qtyallocated = 0.0; //分配量
    var _qtyonhold = 0.0; //冻结量
    var _qtyavailable = 0.0; //可用量    
    var _lotcode = ''; //可用量    
    console.log('根据仓库号、货主、物料查询库存信息,_whseid'+_whseid+',_storerKey'+_storerKey+'_sku'+_sku)

    const $ = db.command.aggregate //获取聚合方法组对象
    var qtytotalInfo = await db.collection('lotxlocxlpn')
    .aggregate()//进行聚合查询
    .match({
        whseid:_whseid,
        storerKey:_storerKey,
        sku:_sku
    })    
    .lookup({
        from: 'lotattribute',
        let:{lot:'$lot'},
        pipeline:[
            { $match:
                { $expr:
                    {$and:
                        [
                            {$eq:['$lot','$$lot']},
                            {$eq:['$lottables.lottable01','110']}
                        ]
                    }
                }
            },
            { $project : { lottables: 1,createTime:1}}
            // ,{ $sort: {'lottables.lottable02': -1}}
        ],
        as: 'lotattribute'
    })
    .match({
        lotattribute: { $ne: [] }
    })
    .sort({'lotattribute.lottables.lottable02':-1})
    .end()//结束聚合返回结果     
    console.log("分组查询编码库存信息")
    console.log(JSON.stringify(qtytotalInfo))

    var returnData = {
        sku:_sku,
        skuqty : _skuqty,
        qtypick : _qtypick,
        qtyallocated : _qtyallocated,
        qtyonhold : _qtyonhold,
        qtyavailable : _qtyavailable,
        loc : _loc,
        skulpn : _skulpn,
        lotcode : _lotcode
    }
    console.log(returnData)
    return returnData
}

//根据仓库和物料以及订单指定要求查询库存信息
async function findStockInfoByAllocation(alstdparms) {

    var _whseid = alstdparms.whseid
    var _storerKey = alstdparms.storerKey
    var _sku = alstdparms.sku
    var _lpn = alstdparms.lpn

     //拼接库存查询参数
     var stockWher = {
        whseid: _whseid,
        storerKey: _storerKey,
        sku: _sku,
        qtyavailable: _.gt(0)
    }

    //如果订单指定箱号，只分配指定的箱号库存
    if (_lpn != '') {
        Object.assign(stockWher, { lpn: _lpn })
    }
    console.log(stockWher)
    //查询库存记录是否存在，如果存在增加库存数量，如果不存在新增库存记录
    const $ = db.command.aggregate //获取聚合方法组对象
    var lotxlocxlpnInfo = await db.collection('lotxlocxlpn')
    .aggregate()//进行聚合查询
    .match(stockWher)    
    .lookup({
        from: 'lotattribute',
        let:{lot:'$lot'},
        pipeline:[
            { $match:
                { $expr:
                    {$and:
                        [
                            {$eq:['$lot','$$lot']}
                        ]
                    }
                }
            },
            { $project : { lottables: 1,createTime:1}}
        ],
        as: 'lotattribute'
    })
    .match({
        lotattribute: { $ne: [] }
    })
    .sort({'lotattribute.lottables.lottable02':1})
    .end()//结束聚合返回结果     

    // var lotxlocxlpnInfo = await db.collection('lotxlocxlpn')
    //     .where(stockWher)
    //     .get();
    console.log("lotxlocxlpninfo")
    console.log(lotxlocxlpnInfo)    
    
    return lotxlocxlpnInfo.data
}

module.exports.findStockInfoByById=findStockInfoByById;
module.exports.findStockInfoByBySku=findStockInfoByBySku;
module.exports.findStockInfoByAllocation=findStockInfoByAllocation;

