
        // examples:
        // "sources": {
        //     "/tmp/test-1": {
        //         "checkMethod": "watch, check, manual",
        //         "checkInterval": 5,
        //         "destinations": [
        //             {
        //                 "endpoint": "massive",
        //                 "location": "/home/test/test-1",
        //                 "exclusions": ["*~"]
        //             },
        //             {
        //                 "endpoint": "store.monash",
        //                 "location": "test-1-bucket"
        //             }
        //         ]
        //     }
        // }
        //
        // "endpoints": {
        //     "massive": {
        //         "method": "scp2",
        //         "options": {
        //             "host": "massive.monash.edu",
        //             "port": 22,
        //             "username": "edm-tester",
        //             "privateKey": "AAAABBBCCCCEEDSEFAEFAEFAEFwefaewf982y3fh9"
        //         }
        //     },
        //     "mytardis": {
        //         "method": "S3",
        //         "options": {
        //             "EC2_ACCESS_KEY": "ABC123",
        //             "EC2_SECRET_KEY": "CDE456"
        //         }
        //     }
        // }
        //
        // "serverSettings": {
        //     "host": "localhost:4000",
        //     "connection": "poll, socket",
        //     "interval": 5
        // }
        //
        // "appSettings": {}
