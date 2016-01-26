/// <reference path="Project.ts"/>

module CocoonSDK {

    export interface PaymentPlan {
        name: string
    }
    export interface UserData {
        id: string,
        username: string,
        email: string,
        name: string,
        lastname: string,
        eula: boolean,
        plan: PaymentPlan,
        connections: string[],
        keys: {[key: string]: CompilationKey[]},
        migration: any
    }
}
