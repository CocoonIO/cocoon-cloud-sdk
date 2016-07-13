/// <reference path="Project.ts"/>

namespace CocoonSDK {
    'use strict';

    export interface PaymentPlan {
        name: string;
    }
    export interface UserData {
        id: string;
        username: string;
        email: string;
        name: string;
        lastname: string;
        eula: boolean;
        plan: PaymentPlan;
        connections: string[];
        keys: {[key: string]: CompilationKey[]};
        migration: any;
    }
}
