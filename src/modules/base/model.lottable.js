const tools = require("../../utils/tools");
const stockBase = require("../inventory/stockBase");
const cloudbase = require("@cloudbase/node-sdk");
const userBase = require("./userBase");
const lottableBase = require("./lottableBase");
const app = cloudbase.init({
    env: cloudbase.SYMBOL_CURRENT_ENV
});

const userInfo = app.auth().getUserInfo();
const db = app.database();
const _ = db.command

//创建批属性
async function createLottable(para) {
    var msg =''
    var status = 'complete'

    var _userId = para.UserId;
    //根据用户号获取默认仓库号、货主
    var userInfo  = await userBase.findUserInfoByById(_userId)
    var _whseid = userInfo.whseid
    var _storerKey = userInfo.storerKey
    var _warehouse= userInfo.warehouse

    //获取批次个数和批属性名称等信息
    var slotInfoList  = para.SlotInfoList
    var _num = Number(await tools.findSlotValue(slotInfoList,'num'))
    var _lottable = await tools.findSlotValue(slotInfoList,'lottable')
    console.log("_whseid:"+_whseid+",_lottable:"+_lottable+",userid:"+_userId+',_num'+_num)

    //将用户输入的批属性值转换成数组
    var lottableList = _lottable.replace('，',',').split(',')

    //校验批属性个数是否和用户输入个数一致
    if(lottableList.length!=_num){
        status = "error"
        msg = "创建失败，批属性个数是否和用户输入个数一致"
    }else{
        //系统默认一个收货日期属性
        var _lottables = [{
            lottableKey:'lottable01',
            lottableName:'批次号',
            required:1,
            sys:1
        },{
            lottableKey:'lottable02',
            lottableName:'收货日期',
            required:1,
            sys:1
        }]

        //拼接用户展示批属性提示
        var mlot = '批次号,收货日期'

        //将数组转成创建批属性参数
        lottableList.forEach(function(v,i,a){
            var lotnum = 3+i;            
            var _lottableKey = 'lottable';
            if(lotnum<9){
                _lottableKey = _lottableKey + '0'+lotnum;
            }else{
                _lottableKey = _lottableKey +lotnum;
            }

            console.log(v)
            var lot = {
                lottableKey:_lottableKey,
                lottableName:v,
                required:1,
                sys:0
            }
            _lottables.push(lot)

            mlot = mlot + ',' + v
        });

        //查询仓库号是否已经配置批属性，如果已经配置更新批属性
        var lottableInfo = await lottableBase.findLottableInfoByWh({whseid:_whseid})
        console.log("lottableInfo")
        console.log(lottableInfo)
        if(lottableInfo[0]){
            var _options = {
                userId:_userId,
                lottable_id:lottableInfo[0]._id,
                lottables:_lottables
            }
            await lottableBase.updateLottable(_options,{})
            msg = '批属性更新成功,批属性值：'+mlot
        }else{
            var _options = {
                userId:_userId,
                whseid:_whseid,
                lottables:_lottables
            }
            var _lottableId = await lottableBase.addLottable(_options,{})
            msg = '批属性创建成功,ID:'+_lottableId+'批属性值：'+mlot
        }        
    }

    var _body = {userId:_userId,whseid:_whseid,warehouse:_warehouse}
    //补充库存库存信息，物料种类和库存数量
    var stockInfo = await stockBase.findStockInfoByById(_whseid,_storerKey)

    Object.assign(_body, stockInfo)  

    var returnData = {
        Status:status,
        Body:_body,
        Content:msg
    }
    return returnData
}

module.exports.createLottable=createLottable;