import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Client } from "../types";
import {
  CreditCard,
  User as UserIcon,
  Phone,
  DollarSign,
  Smartphone,
  Loader2,
  CheckCircle,
  XCircle,
  Wifi,
  Lock,
  ArrowRight
} from "lucide-react";

interface MpesaPushProps {
  currency: string;
  mpesaNumber: string;
}

export default function MpesaPush({ currency, mpesaNumber }: MpesaPushProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // STK Form State
  const [clientId, setClientId] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");

  // STK Push Simulation State
  const [simulationActive, setSimulationActive] = useState(false);
  const [simulationPhase, setSimulationPhase] = useState(0);
  const [simulationError, setSimulationError] = useState("");
  const [simulationSuccess, setSimulationSuccess] = useState<any>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const clientList = await api.clients.getAll();
        setClients(clientList);
        if (clientList.length > 0) {
          setClientId(clientList[0].id.toString());
          setPhone(clientList[0].phone);
          setAmount(clientList[0].monthly_price.toString());
        }
        setError("");
      } catch (err) {
        setError("Failed to load clients list for STK push.");
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const handleClientChange = (idStr: string) => {
    setClientId(idStr);
    const selectedCli = clients.find(c => c.id.toString() === idStr);
    if (selectedCli) {
      setPhone(selectedCli.phone);
      setAmount(selectedCli.monthly_price.toString());
    }
  };

  const handleSendSTKPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !phone || !amount) {
      alert("Please fill in all form inputs.");
      return;
    }

    // Begin simulated STK push flow
    setSimulationActive(true);
    setSimulationError("");
    setSimulationSuccess(null);
    setSimulationPhase(1); // Phase 1: Contacting Safaricom DARU Gateway

    // Phase 1 -> 2: Contacting Gateway (1.5 seconds)
    setTimeout(() => {
      setSimulationPhase(2); // Phase 2: Dispatching STK push prompt to user device
    }, 1500);

    // Phase 2 -> 3: Dispatching (1.5 seconds)
    setTimeout(() => {
      setSimulationPhase(3); // Phase 3: Listening for client to type Safaricom PIN code
    }, 3000);

    // Phase 3 -> API Call: Execute simulated transaction (3.5 seconds)
    setTimeout(async () => {
      try {
        const res = await api.payments.stkPush({
          client_id: Number(clientId),
          phone: phone,
          amount: Number(amount)
        });

        if (res.success) {
          setSimulationSuccess({
            ref: res.reference_number,
            message: res.message
          });
          setSimulationPhase(4); // Successful!
        } else {
          setSimulationError("M-Pesa transaction was declined by the subscriber.");
          setSimulationPhase(5); // Error Phase
        }
      } catch (err: any) {
        console.error(err);
        setSimulationError(err.message || "Failed to finalize M-Pesa STK transaction.");
        setSimulationPhase(5);
      }
    }, 6000);
  };

  const resetSimulation = () => {
    setSimulationActive(false);
    setSimulationPhase(0);
    setSimulationError("");
    setSimulationSuccess(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Safaricom M-Pesa Express</h1>
        <p className="text-sm text-slate-500">
          Trigger interactive Safaricom STK Push prompts directly to client mobile phones.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-semibold rounded-r-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
          <p className="text-slate-500 text-sm">Binding Safaricom Express integrations...</p>
        </div>
      ) : !simulationActive ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* M-Pesa STK Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm md:col-span-3">
            <div className="flex items-center gap-2 text-emerald-600 font-bold border-b border-slate-100 pb-4 mb-5">
              <CreditCard className="w-5 h-5" />
              <h2>STK Push Payment Trigger</h2>
            </div>

            <form onSubmit={handleSendSTKPush} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Select Subscriber Account *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <UserIcon className="w-5 h-5" />
                  </span>
                  <select
                    value={clientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-700"
                  >
                    {clients.map((cli) => (
                      <option key={cli.id} value={cli.id}>
                        {cli.name} ({cli.phone} - {cli.estate})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    M-Pesa Phone Number *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0795 099525"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Bill Amount (KES) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <DollarSign className="w-4 h-4" />
                    </span>
                    <input
                      type="number"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 2500"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/10 transition flex items-center justify-center gap-2 mt-2"
              >
                <Smartphone className="w-4 h-4" />
                Dispatch STK Push Prompt
              </button>
            </form>
          </div>

          {/* M-Pesa Instructions / Credentials Sidebar */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 md:col-span-2 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Integration Details</h3>
            
            <div className="space-y-3.5 text-xs text-slate-600 font-medium">
              <div className="bg-white p-3 rounded-xl border border-slate-200/50">
                <span className="text-3xs text-slate-400 uppercase font-bold block">Business Number</span>
                <span className="font-mono text-sm font-black text-slate-700 block mt-0.5">{mpesaNumber}</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/50">
                <span className="text-3xs text-slate-400 uppercase font-bold block">Callback URL status</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active Listening (Port 3000)
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-2.5 text-2xs text-slate-400 font-medium leading-relaxed">
              <p>
                1. Clicking Dispatch transmits an STK Push packet over Safaricom Express API networks.
              </p>
              <p>
                2. Client receives a popup asking for their Safaricom M-Pesa 4-digit secret PIN code.
              </p>
              <p>
                3. Once the PIN is authorized, Safari express handles direct bank clearing and callback hooks immediately unlock subscriber router internet bandwidth!
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* DISPATCH SIMULATOR PANEL */
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl text-center max-w-md mx-auto space-y-6">
          
          {/* Simulation Header */}
          <div className="inline-flex p-4 rounded-3xl bg-emerald-50 text-emerald-600">
            <Smartphone className="w-10 h-10 animate-bounce" />
          </div>

          <h2 className="text-xl font-black text-slate-800 tracking-tight">STK Express Simulator</h2>

          {/* SIMULATION STEPPER / PHASES */}
          <div className="space-y-4 max-w-xs mx-auto">
            {simulationPhase === 1 && (
              <div className="space-y-2">
                <div className="flex justify-center">
                  <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                </div>
                <p className="text-sm font-bold text-slate-700">Connecting Safaricom express API...</p>
                <p className="text-xs text-slate-400">Verifying merchant keys and balance hooks...</p>
              </div>
            )}

            {simulationPhase === 2 && (
              <div className="space-y-2">
                <div className="flex justify-center">
                  <Smartphone className="w-6 h-6 text-emerald-600 animate-pulse" />
                </div>
                <p className="text-sm font-bold text-slate-700">Dispatching STK push payload...</p>
                <p className="text-xs text-slate-400">Triggering prompt on phone: <span className="font-mono font-bold text-slate-600">{phone}</span></p>
              </div>
            )}

            {simulationPhase === 3 && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                <div className="flex justify-center">
                  <Lock className="w-5 h-5 text-amber-600 animate-bounce" />
                </div>
                <p className="text-xs font-bold text-slate-700">Awaiting Subscriber PIN auth...</p>
                <p className="text-3xs text-slate-400 leading-normal">
                  "Safaricom: Pay KES {amount} to KAMBO WIFI? Enter PIN to approve."
                </p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 animate-[loading_4s_ease-in-out_infinite]" style={{ width: "65%" }}></div>
                </div>
              </div>
            )}

            {simulationPhase === 4 && simulationSuccess && (
              <div className="space-y-3 text-center">
                <div className="flex justify-center">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <p className="text-sm font-black text-slate-800">Payment Successfully Received!</p>
                <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl font-mono text-2xs text-left text-slate-600 space-y-1.5">
                  <p><strong>Receipt:</strong> {simulationSuccess.ref}</p>
                  <p><strong>Status:</strong> Subscriber Reactivated</p>
                  <p><strong>Captured:</strong> KES {amount}.00</p>
                </div>
                <button
                  onClick={resetSimulation}
                  className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                >
                  Confirm and Return <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {simulationPhase === 5 && simulationError && (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <p className="text-sm font-bold text-slate-700">Express Prompt Declined</p>
                <p className="text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-lg border border-red-100">
                  {simulationError}
                </p>
                <button
                  onClick={resetSimulation}
                  className="w-full mt-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition"
                >
                  Retry Dispatch
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
