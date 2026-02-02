# BSC Deployment and Verification Guide

## Deployment Summary ✅

Successfully deployed ERC-8004 contracts to BSC Mainnet with vanity addresses (0x8004 prefix).

### Deployed Addresses

| Contract | Address | BSCScan Link |
|----------|---------|--------------|
| **Identity Registry** | `0x8004c274E3770d32dc1883ab5108b0eA28A854D5` | [View](https://bscscan.com/address/0x8004c274E3770d32dc1883ab5108b0eA28A854D5) |
| **Reputation Registry** | `0x8004e9D54904EaAFc724A743Fea4387Fa632dc2D` | [View](https://bscscan.com/address/0x8004e9D54904EaAFc724A743Fea4387Fa632dc2D) |
| MinimalUUPSBSC | `0x17D12D144C27cda7E832d0B97502DA7C1bbF0651` | [View](https://bscscan.com/address/0x17D12D144C27cda7E832d0B97502DA7C1bbF0651) |
| Identity Implementation | `0xf82DF2F7bA52B441718aA0607E3d5DC5aCc8C934` | [View](https://bscscan.com/address/0xf82DF2F7bA52B441718aA0607E3d5DC5aCc8C934) |
| Reputation Implementation | `0x27BCB83AC4467fA1C3a102169574f50168F59C18` | [View](https://bscscan.com/address/0x27BCB83AC4467fA1C3a102169574f50168F59C18) |

**Deployment Block**: 78,275,879  
**Deployer**: 0x247D283b6101cf27e26548aA28FBB139F9D346d5

## Verification Status

### Sourcify ✅

All contracts verified on Sourcify:
- [MinimalUUPSBSC](https://sourcify.dev/server/repo-ui/56/0x17D12D144C27cda7E832d0B97502DA7C1bbF0651)

### BSCScan ⚠️

**Issue**: BSCScan API V1→V2 migration incomplete
- V1 API: "deprecated endpoint"
- V2 API: 404 Not Found
- **Manual verification required**

## Manual Verification Steps

Visit: https://bscscan.com/verifyContract

### Compiler Settings (All Contracts)
- Compiler: **v0.8.24+commit.e11b9ed9**
- License: **MIT**
- Optimization: **Yes**, 200 runs
- EVM Version: **shanghai**

### Flattened Source Files

Located in `/home/ubuntu/erc-8004-contracts/`:
- `MinimalUUPSBSC-flattened.sol`
- `IdentityRegistryUpgradeable-flattened.sol`
- `ReputationRegistryUpgradeable-flattened.sol`

## Critical Fix

**Problem**: Original `initialize()` set owner to `msg.sender` (factory), not deployer.

**Solution**: Accept owner parameter:
```solidity
function initialize(address owner_, address identityRegistry_) public initializer {
    __Ownable_init(owner_);
    __UUPSUpgradeable_init();
    _identityRegistry = identityRegistry_;
}
```

## Deployment Method

- **CREATE2** via SAFE Singleton Factory: `0x914d7Fec6aaC8cd542e72Bca78B30650d45643d7`
- **Vanity salts**: Calculated to achieve 0x8004 prefix
- **Two-phase**: MinimalUUPS placeholder → Real implementation upgrade

Configuration: `/home/ubuntu/erc-8004-contracts/bsc-vanity-config-v2.json`

## Next Steps

1. ✅ Deployment completed
2. ✅ Sourcify verification
3. ⏳ **Manual BSCScan verification** (API issue)
4. ⏳ Update Agentscan frontend for BSC
5. ⏳ Initialize blockchain sync for BSC
