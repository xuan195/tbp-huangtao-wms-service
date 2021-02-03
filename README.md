1.功能设计
1.1基础模块功能
1.1.1仓库、库区、库位、货品、货主管理、用户、角色、批属性

1.2收货模块
1.2.1 ASN收货单、ASN按单收货、ASN按货品收货、无单按货品收货

1.3库存管理
1.3.1 库存查询、移动、调整

1.4出库模块
1.4.1 出库订单、按单拣货、订单按编码拣货、无单按编码拣货、拣货单管理、订单发运、落放ID发运

2.数据库设计
2.1基础模块功能
2.1.1 仓库表 warehouse
{仓库号:00001，仓库名称：炎陵新生黄家，描述:新生黄家}
{whseid:00001，name：炎陵新生黄家，desc:新生黄家}
2.1.2 库区
{仓库号:00001，库区号:ST，库区名称：收货区}
{仓库号:00001，库区号:A01，库区名称：A01区}
2.1.3 库位
{仓库号:00001，库区号:ST，库位编号:STAGE，库位名称：收货库位}
{仓库号:00001，库区号:A01，库位编号:A01-1-1-01，库位名称：A01区1排1层01列}
2.1.4 货品
{货品编号：SKU001，货品名称：黄桃，仓库号：00001，收货库位：STAGE}
2.1.5 用户
{用户编号：hxs，用户名称：黄旭，邮箱：xxx@126.com，角色:[角色编号],默认仓库：xxx，默认货主：xxx}
{userId：hxs，name：黄旭，email：xxx@126.com，role:[角色编号],whseid：xxx,storerKey：00001}
2.1.6 角色
{角色编号：00001，角色名称：炎陵新生黄家管理员，仓库明细：[仓库号]，是否管理员：true}
2.1.7 货主
{货主编号：00001，货主名称：黄家，仓库号：00001，货主分类：01,地址：xxx，电话：xxx}
2.1.8 批属性 lottable
{批属性编号：00001，仓库号：00001，批属性值：[{批属性键：批属性1，批属性名称：批次号，是否必填：是，是否系统默认：否}]}
{lottableId:xxx,lottables:[{lottableKey:lottable01,lottableName:批次号，required:0，sys:1},{lottableKey,lottable02,lottableName:收货日期，required:1，sys:1}]}


2.2收货模块
2.2.1 收货单表 receipt
{仓库号:00001，收货单号：0000000001，货主编号：00001，供应商：00001，外部单号：xxx，外部行号：xxx，单据类型：xxx，预计到货日期：xxx，状态：xxx，货品编号：SKU001，托盘号：xxx，预计数：100，收货数：20，库位：xxx，批次：xxx，批属性编号：xx，批属性值：[{批属性健：批属性1，批属性值：批次号}]}
{whseid:00001，receiptKey：0000000001，storerKey：00001，supplierCode：00001，externreceiptKey：xxx，externLineno：xxx，type：xxx，expectedReceiptDate：xxx，status：xxx，sku：SKU001，toId：xxx，qtyexpected：100，qtyreceived：20，toLoc：xxx，toLot：xxx，lottableId:xx,lottables:{lottable01：xxx，lottable02:xxx}}

2.3库存模块
2.3.1 库存表 lotxlocxlpn
{仓库号:00001，货主编号：xxx，货品编号：SKU001,库位编号：STAGE，LPN：L000000001，批次：xxx，状态：xxx，现有数量：xxx，分配数量：xxx，拣货数量：xxx，冻结数量：xxx,可用数量：xxx}
{whseid:00001，storerKey：xxx，sku：SKU001,loc：STAGE，lpn：L000000001，lot：xxx，status：OK，qty：xxx，qtyallocated：xxx，qtypicked：xxx，qtyonhold：xxx，qtyavailable：xxx}
2.3.2 批属性表 lotattribute
{仓库号:00001，货主编号：xxx，货品编号：SKU001，批次号：xxx，批属性值：[{批属性健：批属性1，批属性值：批次号}]}
{whseid:00001，storerKey：xxx，sku：SKU001，lot：xxx，lottables:{lottable01：xxx，lottable02:xxx}}

2.4出库模块
2.3.1 出库订单 orders
{仓库号:00001，出库单号：0000000001，货主编号：00001，客户：00001，承运商：00001，外部单号：xxx，外部行号：xxx，单据类型：xxx，需求发货日期：xxx，实际发货时间：xxx，状态：xxx，货品编号：SKU001，箱号：xxx，订单数：100，未结数：100，分配数：100，拣货数：100，发运数：100，批属性1：xxx，批属性2：xxx~批属性12：xxx}
{whseid:00001，orderKey：0000000001，storerKey：00001，consigneeKey：00001，carrierCode：00001，externorderKey：xxx，externLineno：xxx，type：xxx，requestedshipDate：xxx，actualshipDate：xxx，status：xxx，sku：SKU001，lpn：xxx，originalqty：100，openqty：100，qtyallocated：100，qtypicked：100，shippedqty：100，lottable01：xxx~lottable12：xxx}
2.3.2 拣货单 pickdetail
{仓库号:00001，拣货序号：xxx，货主编号：00001，货品编号：SKU001，出库单号：0000000001，状态：xxx，批次号：xxx，库位：xxx，箱号：xxx，落放 ID：xx,来源库位：xxx,目标库位：xxx，拣货数：100，箱序号：xxx,波次号：xxx}
{whseid:00001，pickdetailkey：xxx，storerKey：00001，sku：sku001，orderKey：0000000001，status：xxx，lot：xxx，loc：xxx，lpn：xxx，dropid：xx,fromLoc:x,toloc：xxx，qty：100，caseid：xxx，waveKey：xxx}

3.功能开发
3.1 完成一次收货
3.1.1 创建一个收货类：包含一个根据收货单号收货方法
3.1.2 通过TBP服务调用收货云函数，对话内容如下：1问“按单收货”，2答“请输入收货单号”，3问“xxx”，4答“收货完成，本次收货数xx剩余库存数为xxx”。

3.2 完成一次无ASN按物料收货
3.2.1 创建一个无单按物料收货方法：根据用户ui获取默认仓库和默认货主，自动创建收货单，再调用按单收货完成物料收货
3.2.2 通过TBP服务调用收货云函数，对话内容如下：1开始“按物料收货”，2问“请输物料”，3问“请输入数量”，4答“xx物料收货完成，本次收货数xx剩余库存数为xxx”。

3.3 完成一次出库单出库
3.3.1 创建一个出库类：包含一个根据出库单号出库方法，通过出库单创建拣货单，再通过拣货到完成库存扣减
3.3.2 通过TBP服务调用收货云函数，对话内容如下：1问“按单出库”，2答“请输入出库单号”，3问“xxx”，4答“出库完成，本次出库数xx剩余库存数为xxx”。

4.代码整理
4.1 flutter 页面插件化
4.2 框架类抽取
4.3 数据库事务处理

5.代码上传
