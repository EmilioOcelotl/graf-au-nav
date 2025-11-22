(
n = NetAddr("127.0.0.1", 57121);

Routine({
    loop {
        n.sendMsg("/miControl", rrand(-1.0, 1.0));
        2.wait;
    }
}).play;
)