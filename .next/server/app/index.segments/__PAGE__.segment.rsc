1:"$Sreact.fragment"
2:I[96777,["/_next/static/chunks/0wrmwqukc9tt-.js","/_next/static/chunks/0a0o4dde.oa2w.js","/_next/static/chunks/0m0z7t45v9r65.js"],"default"]
4:I[97367,["/_next/static/chunks/0wrmwqukc9tt-.js","/_next/static/chunks/0a0o4dde.oa2w.js"],"OutletBoundary"]
5:"$Sreact.suspense"
3:T400,In the Linux kernel, the following vulnerability has been resolved:

netfilter: nf_tables: fix inverted genmask check in nft_map_catchall_activate()

nft_map_catchall_activate() has an inverted element activity check
compared to its non-catchall counterpart nft_mapelem_activate() and
compared to what is logically required.

nft_map_catchall_activate() is called from the abort path to re-activate
catchall map elements that were deactivated during a failed transaction.
It should skip elements that are already active (they don't need
re-activation) and process elements that are inactive (they need to be
restored). Instead, the current code does the opposite: it skips inactive
elements and processes active ones.

Compare the non-catchall activate callback, which is correct:

  nft_mapelem_activate():
    if (nft_set_elem_active(ext, iter->genmask))
        return 0;   /* skip active, process inactive */

With the buggy catchall version:

  nft_map_catchall_activate():
    if (!nft_set_elem_active(ext, genmask))
 0:{"rsc":["$","$1","c",{"children":[["$","$L2",null,{"latestPocs":[{"id":"1266459179","cve_id":"CVE-2026-23111","name":"CVE-2026-23111-nftables-lab","owner":"ishankaru","full_name":"ishankaru/CVE-2026-23111-nftables-lab","html_url":"https://github.com/ishankaru/CVE-2026-23111-nftables-lab","description":"Exposure checker and safe disposable-VM lab for CVE-2026-23111 (Linux nf_tables use-after-free local privilege escalation). Defensive: detection, mitigation, multi-distro lab. No exploit.","stargazers_count":"0","vuln_description":"$3","created_at":"2026-06-12 01:28:31","updated_at":"2026-06-12 03:06:15","pushed_at":"2026-06-12 03:05:23","inserted_at":"2026-06-12 04:36:43"},{"id":"1266417578","cve_id":"CVE-2026-23479","name":"redis-cve-2026-23479-scanner","owner":"v1c0mmrt","full_name":"v1c0mmrt/redis-cve-2026-23479-scanner","html_url":"https://github.com/v1c0mmrt/redis-cve-2026-23479-scanner","description":"CVE-2026-23479 Redis Use-After-Free vulnerability detection tool","stargazers_count":"0","vuln_description":"Redis is an in-memory data structure store. In redis-server from 7.2.0 until 8.6.3, the unblock client flow does not handle an error return from `processCommandAndResetClient` when re-executing a blocked command. If a blocked client is evicted during this flow, an authenticated attacker can trigger a use-after-free that may lead to remote code execution. This has been patched in version 8.6.3.","created_at":"2026-06-12 00:43:56","updated_at":"2026-06-12 01:25:59","pushed_at":"2026-06-12 01:18:22","inserted_at":"2026-06-12 04:36:43"},{"id":"1266392105","cve_id":"CVE-2026-11645","name":"CVE-2026-11645","owner":"0xBlackash","full_name":"0xBlackash/CVE-2026-11645","html_url":"https://github.com/0xBlackash/CVE-2026-11645","description":"CVE-2026-11645","stargazers_count":"1","vuln_description":"Out of bounds read and write in V8 in Google Chrome prior to 149.0.7827.103 allowed a remote attacker to execute arbitrary code inside a sandbox via a crafted HTML page. (Chromium security severity: High)","created_at":"2026-06-12 00:17:47","updated_at":"2026-06-12 03:03:46","pushed_at":"2026-06-12 00:58:17","inserted_at":"2026-06-12 04:36:43"}]}],[["$","script","script-0",{"src":"/_next/static/chunks/0m0z7t45v9r65.js","async":true}]],["$","$L4",null,{"children":["$","$5",null,{"name":"Next.MetadataOutlet","children":"$@6"}]}]]}],"isPartial":false,"staleTime":300,"varyParams":null,"buildId":"09PNDjusq38tQl4mLcWiT"}
6:null
