// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.11;
pragma experimental ABIEncoderV2;

import "./HederaTokenService.sol";
import "./IHederaTokenService.sol";
import "./HederaResponseCodes.sol";

contract DomainWeb23 is HederaTokenService {
    mapping(string => address) private btldToTokenAddress;
    address private tokenAddress;
    address payable private owner;
    uint256 private _tokenIds = 0;
    mapping(string => string) private domainToAssets;
    mapping(string => bool) private isDomainBooked;
    mapping(string => bool) private isBtldEnabled;
    mapping(string => bool) private isDomainBookingStarted;
    struct DomainInfo {
        address domainOwnerAddress;
        string domainName;
        string siteAddress;
        uint256 timestamp;
        int64 serialNumber;
    }
    mapping(address => DomainInfo[]) private addressToDomainsInfo;
    mapping(address => string[]) private addressToDomains;
    mapping(string => DomainInfo) private nameToDomainInfo;
    mapping(bytes32 => DomainInfo) private hashToDomainInfo;

    constructor(address _tokenAddress) {
        tokenAddress = _tokenAddress;
        owner = payable(msg.sender);
        isBtldEnabled["hbar"] = true;
        btldToTokenAddress["hbar"] = tokenAddress;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    /// Returns substring from the String
    /// @param str the String from which substring needs to extracted out
    /// @param startIndex the position from where the substring will start
    /// @return SubString The Substring returned from String, str , starting from startIndex.
    function substring(string memory str, uint256 startIndex)
        private
        pure
        returns (string memory)
    {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(strBytes.length - startIndex);
        for (uint256 i = startIndex; i < strBytes.length; i++) {
            result[i - startIndex] = strBytes[i];
        }
        return string(result);
    }

    /// Returns Index position of the delimeter in the String
    /// @param str the String from which delimeter position needs to extracted out
    /// @param delim the delimeter from where the substring will start
    /// @return SubString The Substring returned from String, str , starting from startIndex.
    function indexOf(string memory str, string memory delim)
        private
        pure
        returns (uint256)
    {
        bytes memory strBytes = bytes(str);
        for (uint256 i = 0; i < strBytes.length; i++) {
            if (strBytes[i] == bytes(delim)[0]) {
                return i;
            }
        }
        return 0;
    }

    //Return ownerAddress with status
    function mintNonFungibleToken(bytes32 _hash, bytes[] memory _metadata)
        external
        onlyOwner
        returns (
            bool,
            int64,
            address
        )
    {
        require(
            bytes(hashToDomainInfo[_hash].domainName).length > 0,
            "Domain Entry Unavailable"
        );
        require(
            nameToDomainInfo[hashToDomainInfo[_hash].domainName].serialNumber ==
                0,
            "Already Minted"
        );
        uint64 _amount = 0;
        string memory domName = hashToDomainInfo[_hash].domainName;
        uint256 ii = indexOf(domName, ".");
        address domainOwner = hashToDomainInfo[_hash].domainOwnerAddress;
        string memory parentBtld = substring(domName, ii + 1);
        (
            int256 response,
            uint64 newTotalSupply,
            int64[] memory serialNumbers
        ) = HederaTokenService.mintToken(
                btldToTokenAddress[parentBtld],
                _amount,
                _metadata
            );

        if (response != HederaResponseCodes.SUCCESS && newTotalSupply == 0) {
            isDomainBookingStarted[domName] = false;
            return (false, 0, domainOwner);
        } else {
            nameToDomainInfo[(domName)].serialNumber = serialNumbers[0];
            DomainInfo memory domainInfo;
            domainInfo.domainName = domName;
            domainInfo.siteAddress = "";
            domainInfo.domainOwnerAddress = nameToDomainInfo[domName]
                .domainOwnerAddress;
            domainInfo.timestamp = block.timestamp;
            isDomainBooked[domName] = true;
            addressToDomainsInfo[domainInfo.domainOwnerAddress].push(
                domainInfo
            );
            addressToDomains[domainInfo.domainOwnerAddress].push(domName);
            transferNft(tokenAddress, domainOwner, serialNumbers[0]);
            return (true, serialNumbers[0], domainOwner);
        }
    }

    function receivePayment(string memory _domainName)
        public
        payable
        returns (bool, bytes32)
    {
        uint256 ii = indexOf(_domainName, ".");
        string memory parentBtld = substring(_domainName, ii + 1);
        require(isBtldEnabled[parentBtld], "BTLD not enabled");
        require(
            btldToTokenAddress[parentBtld] != address(0x0),
            "Token not mapped for BTLD"
        );
        require(!isDomainBooked[_domainName], "Domain Already booked");
        require(
            !isDomainBookingStarted[_domainName],
            "Domain Booking in progress"
        );
        (bool success, ) = owner.call{value: msg.value}("");
        bytes32 hash = "";
        if (success == true) {
            address btldToken = btldToTokenAddress[parentBtld];
            isDomainBookingStarted[_domainName] = true;
            DomainInfo memory domainInfo;
            domainInfo.domainName = _domainName;
            domainInfo.siteAddress = "";
            domainInfo.domainOwnerAddress = msg.sender;
            domainInfo.timestamp = block.timestamp;
            nameToDomainInfo[_domainName] = domainInfo;
            hash = keccak256(bytes(_domainName));
            hashToDomainInfo[hash] = domainInfo;
            HederaTokenService.associateToken(msg.sender, btldToken);
        }
        return (success, hash);
    }

    //Multiple Domains Booking

    function receivePaymentMultiple(string[] memory _domainNames)
        public
        payable
        returns (bool)
    {
        for (uint8 i = 0; i < _domainNames.length; i++) {
            uint256 ii = indexOf(_domainNames[i], ".");
            string memory parentBtld = substring(_domainNames[i], ii + 1);
            require(isBtldEnabled[parentBtld], "BTLD not enabled");
            require(
                btldToTokenAddress[parentBtld] != address(0x0),
                "Token not mapped for BTLD"
            );
            require(!isDomainBooked[_domainNames[i]], "Domain Already booked");
            require(
                !isDomainBookingStarted[_domainNames[i]],
                "Domain Booking in progress"
            );
        }
        (bool success, ) = owner.call{value: msg.value}("");
        if (success == true) {
            for (uint8 i = 0; i < _domainNames.length; i++) {
                bytes32 hash = "";
                uint256 ii = indexOf(_domainNames[i], ".");
                string memory parentBtld = substring(_domainNames[i], ii + 1);
                address btldToken = btldToTokenAddress[parentBtld];
                isDomainBookingStarted[_domainNames[i]] = true;
                DomainInfo memory domainInfo;
                domainInfo.domainName = _domainNames[i];
                domainInfo.siteAddress = "";
                domainInfo.domainOwnerAddress = msg.sender;
                domainInfo.timestamp = block.timestamp;
                nameToDomainInfo[_domainNames[i]] = domainInfo;
                hash = keccak256(bytes(_domainNames[i]));
                hashToDomainInfo[hash] = domainInfo;
                HederaTokenService.associateToken(msg.sender, btldToken);
            }
        }
        return (success);
    }

    //End Multiple Domains Booking

    function getBookingDomainHash(bytes32 _hash) public view returns (bool) {
        if (bytes(hashToDomainInfo[_hash].domainName).length > 0) {
            return true;
        } else {
            return false;
        }
    }

    function getallDomains(address _userAddress)
        public
        view
        returns (string memory)
    {
        string memory data = "1";
        for (
            uint256 i = 0;
            i < addressToDomainsInfo[_userAddress].length;
            i++
        ) {
            data = string(
                abi.encodePacked(
                    data,
                    ",",
                    addressToDomainsInfo[_userAddress][i].domainName
                )
            );
        }

        return data;
    }

    function getDomainInfo(string memory _domainName)
        public
        view
        returns (string memory)
    {
        string memory data = "1,";
        data = string(
            abi.encodePacked(
                data,
                nameToDomainInfo[_domainName].domainName,
                ",",
                nameToDomainInfo[_domainName].siteAddress
            )
        );
        return data;
    }

    function transferNft(
        address token,
        address receiver,
        int64 serial
    ) internal returns (int256) {
        int256 response = HederaTokenService.transferNFT(
            token,
            msg.sender,
            receiver,
            serial
        );

        if (response != HederaResponseCodes.SUCCESS) {
            revert("Failed to transfer non-fungible token");
        }

        return response;
    }

    function isDomainAvailable(string memory _domainName)
        public
        view
        returns (bool)
    {
        return isDomainBooked[_domainName];
    }

    function updateSiteAddress(
        string memory _domainName,
        string memory _siteAddress
    ) public {
        require(
            nameToDomainInfo[_domainName].domainOwnerAddress == msg.sender,
            "Denied Access"
        );
        nameToDomainInfo[_domainName].siteAddress = _siteAddress;
        for (uint256 i = 0; i < addressToDomainsInfo[msg.sender].length; i++) {
            if (
                keccak256(
                    bytes(addressToDomainsInfo[msg.sender][i].domainName)
                ) == keccak256(bytes(_domainName))
            ) {
                addressToDomainsInfo[msg.sender][i].siteAddress = _siteAddress;
            }
        }
    }

    function enableBtld(string memory _btld, address _tokenAddress)
        external
        onlyOwner
    {
        isBtldEnabled[_btld] = true;
        btldToTokenAddress[_btld] = _tokenAddress;
    }

    function disableBtld(string memory _btld) external onlyOwner {
        isBtldEnabled[_btld] = false;
    }

    function setDomainAsset(string memory _domainName, string memory _assethash)
        external
        returns (bool)
    {
        require(isDomainBooked[_domainName], "Domain Doesn't exist");
        require(
            msg.sender == nameToDomainInfo[_domainName].domainOwnerAddress,
            ""
        );
        domainToAssets[_domainName] = _assethash;
        return true;
    }

    function getDomainAsset(string memory _domainName)
        external
        view
        returns (string memory)
    {
        return domainToAssets[_domainName];
    }
}
