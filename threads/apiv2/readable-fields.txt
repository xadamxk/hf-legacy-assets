<?php
 
require_once "hf_api.php";
 
// Initialize api instance
$api = new HF_API();
 
// Set the access token for the specific authorized member
$api->setAccessToken("ACCESS_TOKEN_HERE");
 
// What data do we want to retrieve from the API? Send an array and process the call.
$read = $api->read([
    "me" => [ // Basic Info & Advanced Info Permissions
        'vault' => true, // API Client Vault Balance
        'uid' => true,
        'username' => true,
        'usergroup' => true,
        'displaygroup' => true,
        'additionalgroups' => true,
        'postnum' => true,
        'awards' => true,
        'bytes' => true,
        'threadnum' => true,
        'avatar' => true,
        'avatardimensions' => true,
        'avatartype' => true,
        'lastvisit' => true,
        'usertitle' => true,
        'website' => true,
        'timeonline' => true,
        'reputation' => true,
        'referrals' => true,
        'lastactive' => true,
        'unreadpms' => true,
        'invisible' => true,
        'totalpms' => true,
        'warningpoints' => true,
        'lastactive' => true, // Advanced Info Permission Only
        'unreadpms' => true, // Advanced Info Permission Only
        'invisible' => true, // Advanced Info Permission Only
        'totalpms' => true, // Advanced Info Permission Only
        'warningpoints' => true // Advanced Info Permission Only
    ],
    "forums" => [ // Posts Permissions
        '_fid' => [25],
        'fid' => true,
        'name' => true,
        'description' => true,
        'type' => true
    ],
    "threads" => [ // Posts Permissions
        '_tid' => [6083719], // Access directly by TID
        '_uid' => [59852261], // ...or search by UID and optional _page/_perpage parameters
		'_page' => [123],
        '_perpage' => [123],
        'tid' => true,
        'uid' => true,
        'fid' => true,
        'subject' => true,
        'closed' => true,
        'numreplies' => true,
        'views' => true,
        'dateline' => true,
        'firstpost' => true,
        'lastpost' => true,
        'lastposter' => true,
        'lastposteruid' => true,
        'prefix' => true,
        'icon' => true,
        'poll' => true,
        'username' => true,
        'sticky' => true,
        'bestpid' => true,
        'firstpost' => [
            // '<Post>',
        ]
    ],
    "posts" => [ // Posts Permissions
        '_pid' => [59852261], // Access directly by PID
        '_tid' => [59852261], // ...or search by TID or UID and optional _page/_perpage parameters
        '_uid' => [59852261],
		'_page' => [123],
        '_perpage' => [123],
        'pid' => true,
        'tid' => true,
        'uid' => true,
        'fid' => true,
        'dateline' => true,
        'message' => true,
        'subject' => true,
        'edituid' => true,
        'edittime' => true,
        'editreason' => true,
        'author' => [
            // '<User>',
        ],
    ],
    "users" => [ // Users Permissions
        '_uid' => [42221],
        'uid' => true,
        'username' => true,
        'usergroup' => true,
        'displaygroup' => true,
        'additionalgroups' => true,
        'postnum' => true,
        'awards' => true,
        'myps' => true,
        'threadnum' => true,
        'avatar' => true,
        'avatardimensions' => true,
        'avatartype' => true,
        'usertitle' => true,
        'website' => true,
        'timeonline' => true,
        'reputation' => true,
        'referrals' => true
    ],
    "bytes" => [ // Bytes Permissions
        '_id' => [123], // Access directly by ID...
        '_uid' => [123], // ...or search by UID and optional _page/_perpage parameters
        '_from' => [123], // ...or search by FROM UID and optional _page/_perpage parameters
        '_to' => [123], // ...or search by TO UID and optional _page/_perpage parameters
        '_page' => [123],
        '_perpage' => [123],
        'id',
        'amount',
        'dateline',
        'type',
        'reason',
        'from' => [
            // '<User>',
        ],
        'to' => [
            // '<User>',
        ],
        'post' => [
            // '<Post>'
        ]
    ],
    "contracts" => [ // Contracts Permissions
        '_cid' => [123], // Access directly by Contract ID...
        '_uid' => [123], // ...or search by UID and optional _page/_perpage parameters
        '_page' => [123],
        '_perpage' => [123],
        'cid',
        'dateline',
        'otherdateline',
        'public',
        'timeout_days',
        'timeout',
        'status',
        'istatus',
        'ostatus',
        'cancelstatus',
        'type',
        'tid',
        'inituid',
        'otheruid',
        'muid',
        'iprice',
        'oprice',
        'iproduct',
        'oproduct',
        'icurrency',
        'ocurrency',
        'terms',
        'template_id',
        'oaddress',
        'iaddress',
        'inituser' => [
            // '<User>',
        ],
        'otheruser' => [
            // '<User>',
        ],
        'escrow' => [
            // '<User>',
        ],
        'thread' => [
            // '<Thread>',
        ],
        'idispute' => [
            // '<Dispute>'
        ],
        'odispute' => [
            // '<Dispute>'
        ],
        'ibrating' => [
            // '<Brating>'
        ],
        'obrating' => [
            // '<Brating>'
        ]
    ],
    "disputes" => [ // Contracts Permissions
        '_cdid' => [123], // Access directly by Dispute ID...
        '_cid' => [123], // ...or search by Contract ID...
        '_uid' => [123], // ...or search by UID and optional _page/_perpage parameters
        '_claimantuid' => [123], // ...or search by Claimant UID and optional _page/_perpage parameters
        '_defendantuid' => [123], // ...or search by Defendant UID and optional _page/_perpage parameters
        '_page' => [123],
        '_perpage' => [123],
        'cdid',
        'contractid',
        'claimantuid',
        'defendantuid',
        'dateline',
        'status',
        'dispute_tid',
        'claimantnotes',
        'defendantnotes',
        'contract' => [
            // '<Contract>',
        ],
        'claimant' => [
            // '<User>',
        ],
        'defendant' => [
            // '<User>',
        ],
        'dispute_thread' => [
            // '<Thread>',
        ]
    ],
    "bratings" => [ // Contracts Permissions
        '_crid' => [123], // Access directly by Brating ID...
        '_cid' => [123], // ...or search by Contract ID...
        '_uid' => [123], // ...or search by UID and optional _page/_perpage parameters
        '_from' => [123], // ...or search by FROM UID and optional _page/_perpage parameters
        '_to' => [123], // ...or search by TO UID and optional _page/_perpage parameters
        '_page' => [123],
        '_perpage' => [123],
        'crid',
        'contractid',
        'fromid',
        'toid',
        'dateline',
        'amount',
        'message',
        'contract' => [
            // '<Contract>',
        ],
        'from' => [
            // '<User>',
        ],
        'to' => [
            // '<User>',
        ]
    ],
	"sigmarket" => [
		// use this _type to choose between the two browse options below
		'_type' => 'order|market', // Either 'order' or 'market' only. Order = placed signature market order. Market = available signatures for purchase
		// (read) _type == 'order'
		'_smid' => [123], // Access directly by Order ID...
        '_uid' => [123], // ...or search by UID and optional _page/_perpage parameters
        '_seller' => [123], // ...or search by SELLER UID and optional _page/_perpage parameters
        '_buyer' => [123], // ...or search by BUYER UID and optional _page/_perpage parameters
        '_page' => [123],
        '_perpage' => [123],
		'smid',
		'buyer' => [
			'<User>',
		],
		'seller' => [
			'<User>',
		],
		'startdate',
		'enddate',
		'price',
		'duration',
		'active',
		// (read) _type == 'market'
		'_uid' => [123], // ...or search by UID and optional _page/_perpage parameters
        '_page' => [123],
        '_perpage' => [123],
		'uid',
		'user' => [
			'<User>',
		],
		'price',
		'duration',
		'active',
		'sig',
		'dateadded',
		'ppd'
	]
]);