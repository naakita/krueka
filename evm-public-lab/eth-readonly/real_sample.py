"""One bounded read-only public Ethereum sample; no user identities or deanonymization."""
import json, time, urllib.request
POOL="0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc"
A="https://ethereum-rpc.publicnode.com"
B="https://eth.drpc.org"
START,END=26220288,26220293
DEPOSIT="0xa945e51eec50ab98c161376f0db4cf2aeba3ec92755fe2fcd388bdbbb80ff196"
WITHDRAW="0xe9e508bad6d4c3227e881ca19068f099da81b5164dd6d62b2eaf1e8bc6c34931"
REQ=0
def rpc(url,method,params):
    global REQ
    REQ+=1
    req=urllib.request.Request(url,data=json.dumps({"jsonrpc":"2.0","id":REQ,"method":method,"params":params}).encode(),headers={"Content-Type":"application/json"},method="POST")
    with urllib.request.urlopen(req,timeout=14) as conn: body=conn.read(2000001)
    assert len(body)<2000001,"response too large"
    obj=json.loads(body)
    assert obj.get("jsonrpc")=="2.0" and obj.get("id")==REQ and "error" not in obj and "result" in obj,(url,method,obj)
    return obj["result"]
def val(log):
    return (log["address"].lower(),log["blockNumber"].lower(),log["blockHash"].lower(),log["transactionHash"].lower(),log["logIndex"].lower(),tuple(t.lower() for t in log["topics"]),log["data"].lower())
def run():
    urls=[A,B]
    heads=[int(rpc(u,"eth_blockNumber",[]),16) for u in urls]
    assert min(heads)>=END+64,("unconfirmed sample",heads)
    chains=[int(rpc(u,"eth_chainId",[]),16) for u in urls]
    assert chains==[1,1],("wrong chains",chains)
    headers=[]
    for url in urls:
        chain=[]
        for h in range(START,END+1):
            obj=rpc(url,"eth_getBlockByNumber",[hex(h),False])
            assert obj and int(obj["number"],16)==h
            chain.append((obj["hash"].lower(),obj["parentHash"].lower()))
        for i in range(1,len(chain)):
            assert chain[i][1]==chain[i-1][0],("noncontiguous header chain",url,i)
        headers.append(chain)
    assert headers[0]==headers[1],"header mismatch"
    allrows=[]
    for url in urls:
        rows=rpc(url,"eth_getLogs",[{"address":POOL,"fromBlock":hex(START),"toBlock":hex(END),"topics":[[DEPOSIT,WITHDRAW]]}])
        assert isinstance(rows,list) and len(rows)<=30
        for log in rows:
            h=int(log["blockNumber"],16)
            assert START<=h<=END
            assert log["address"].lower()==POOL
            assert log["blockHash"].lower()==headers[0][h-START][0]
            assert log["topics"][0].lower() in (DEPOSIT,WITHDRAW)
        allrows.append(sorted([val(row) for row in rows]))
    assert allrows[0]==allrows[1],"disagreement on events"
    assert len(set((e[3],e[4]) for e in allrows[0]))==len(allrows[0]),"duplicate events"
    txids=sorted(set(e[3] for e in allrows[0]))
    assert len(txids)<=12,"too many transactions"
    for txid in txids:
        receipts=[]
        origins=[]
        for url in urls:
            tx=rpc(url,"eth_getTransactionByHash",[txid])
            receipt=rpc(url,"eth_getTransactionReceipt",[txid])
            assert tx and receipt
            assert tx["hash"].lower()==txid and receipt["transactionHash"].lower()==txid
            assert int(receipt["status"],16)==1
            assert tx["blockHash"].lower()==receipt["blockHash"].lower()
            origins.append(tx["from"].lower())
            for event in (e for e in allrows[0] if e[3]==txid):
                assert int(receipt["blockNumber"],16)==int(event[1],16)
                assert receipt["blockHash"].lower()==event[2]
                assert sum(val(l)==event for l in receipt["logs"])==1,("receipt does not contain event",url,txid)
            receipts.append((receipt["blockHash"],receipt["status"]))
        assert receipts[0]==receipts[1] and origins[0]==origins[1]
    result={"chain_id":1,"contract":POOL,"start":START,"end":END,"rpc_provider_count":2,"headers_verified_per_provider":len(headers[0]),"event_count":len(allrows[0]),"withdrawal_count":sum(e[5][0]==WITHDRAW for e in allrows[0]),"deposit_count":sum(e[5][0]==DEPOSIT for e in allrows[0]),"receipt_checked_tx_count":len(txids),"conclusion":"matching independent public RPC responses, NOT a consensus proof or personal identification"}
    print("READ_ONLY_CORROBORATION_OK",json.dumps(result,sort_keys=True))
    return result
if __name__=="__main__":run()
