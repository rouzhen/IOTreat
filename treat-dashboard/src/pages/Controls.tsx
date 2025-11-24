import { useState } from "react";
import Layout from "../components/Layout";

const DEVICE_ID = "feeder-demo-001";

export default function Controls() {
    const [message, setMessage] = useState<string>("No command sent yet.");

    function sendDemo(action: string, amount?: number) {
        const text =
            amount != null
                ? `Sent demo command "${action}" (${amount} g) to ${DEVICE_ID}`
                : `Sent demo command "${action}" to ${DEVICE_ID}`;

        console.log(text);
        setMessage(text);
    }

    return (
        <Layout>
            <h1 className="text-3xl font-display text-choco mb-2">
                Manual controls
            </h1>
            <p className="text-choco/70 mb-6">
                These buttons are wired to demo handlers only. In the real system, they
                will call an AWS API that publishes MQTT commands to the feeder.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <button
                    className="rounded-2xl bg-white border border-latte/60 shadow-card px-4 py-3 text-sm hover:bg-cream transition"
                    onClick={() => sendDemo("DISPENSE", 10)}
                >
                    🍖 Dispense 10 g
                </button>
                <button
                    className="rounded-2xl bg-white border border-latte/60 shadow-card px-4 py-3 text-sm hover:bg-cream transition"
                    onClick={() => sendDemo("DISPENSE", 20)}
                >
                    🍖 Dispense 20 g
                </button>
                <button
                    className="rounded-2xl bg-white border border-latte/60 shadow-card px-4 py-3 text-sm hover:bg-cream transition"
                    onClick={() => sendDemo("RETRY")}
                >
                    🔄 Retry last
                </button>
                <button
                    className="rounded-2xl bg-white border border-latte/60 shadow-card px-4 py-3 text-sm hover:bg-cream transition"
                    onClick={() => sendDemo("STOP")}
                >
                    🛑 Stop motor
                </button>
            </div>

            <p className="text-xs text-slate-600 bg-white/60 rounded-xl px-4 py-3 border border-latte/40 inline-block">
                {message}
            </p>
        </Layout>
    );
}
