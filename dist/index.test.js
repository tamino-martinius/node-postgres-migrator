const rewire = require("rewire")
const index = rewire("./index")
const __export = index.__get__("__export")
// @ponicode
describe("__export", () => {
    test("0", () => {
        let param1 = [{ key: "Dillenberg" }, { key: "elio@example.com" }, { key: "Dillenberg" }]
        let callFunction = () => {
            __export(param1)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("1", () => {
        let param1 = [{ key: "Elio" }, { key: "elio@example.com" }, { key: "Dillenberg" }]
        let callFunction = () => {
            __export(param1)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("2", () => {
        let param1 = [{ key: "Elio" }, { key: "Dillenberg" }, { key: "elio@example.com" }]
        let callFunction = () => {
            __export(param1)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("3", () => {
        let param1 = [{ key: "elio@example.com" }, { key: "Elio" }, { key: "elio@example.com" }]
        let callFunction = () => {
            __export(param1)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("4", () => {
        let param1 = [{ key: "Dillenberg" }, { key: "Dillenberg" }, { key: "Elio" }]
        let callFunction = () => {
            __export(param1)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("5", () => {
        let callFunction = () => {
            __export(undefined)
        }
    
        expect(callFunction).not.toThrow()
    })
})
