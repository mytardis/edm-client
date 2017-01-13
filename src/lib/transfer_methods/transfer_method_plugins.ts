import {TransferMethod} from './transfer_method';
import {DummyTransfer} from "./dummy_transfer";
import {LocalTransfer} from "./local_transfer";
import {SCP2Transfer} from "./scp2";

export abstract class TransferMethodPlugins {
    /*
    Mapping of string names to concrete transfer method classes.
    This is intended to be expanded by a plugin system, where
    transfer methods can register themselves here.
     */
    private static methods = {
            'dummy': DummyTransfer,
            'local': LocalTransfer,
            'scp2': SCP2Transfer,
    };

    public static getMethod(method_name) {
        return TransferMethodPlugins.methods[method_name];
    }

    public static registerMethod(method_name: string, method_class: any) {
        if (TransferMethodPlugins.methods[method_name] == null) {
            TransferMethodPlugins.methods[method_name] = method_class;
        }
    }
}