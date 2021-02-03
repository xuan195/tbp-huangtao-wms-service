module.exports = {
    receiveByKey: require("./model.receivebot"),
    receiveBySku: require("./model.receivebot"),
    receiveByLot: require("./model.receivebot"),
    deliveryBySku: require("./model.deliverybot"),
    deliveryByOrderKeyo: require("./model.deliverybot"),
    queryStockBySku: require("./model.stockbot"),
    createUser: require("./model.userbot"),
    loginUser: require("./model.userbot"),
    createLottable: require("./model.lottablebot")
};