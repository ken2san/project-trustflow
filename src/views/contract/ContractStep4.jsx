import React from "react";
import HoldButton from "../../components/ui/HoldButton";
import { Lock, User, Star } from "lucide-react";

const ContractStep4 = ({
    rating, setRating,
    blindRatingSubmitted,
    ratingsRevealed,
    partnerRating,
    ratingLabel,
    handleBlindRatingSubmit,
    handleNextStep, status,
    showPaymentDelay, setShowPaymentDelay,
    paymentDelayed,
    isCancelled
}) => (
    <div className="space-y-12 animate-fade-in-up">
        {!blindRatingSubmitted ? (
            <>
                <div className="flex flex-col items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 p-[2px]">
                        <div className="w-full h-full rounded-full bg-[#020617] flex items-center justify-center overflow-hidden">
                            <User className="w-12 h-12 text-slate-300" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white mb-2">{ratingLabel}</h2>
                        <p className="text-slate-400 text-sm max-w-xs">Your rating is <strong className="text-indigo-300">sealed</strong> until the other party submits theirs. Neither side can game the score.</p>
                    </div>
                    <div className="flex gap-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} onClick={() => setRating(star)} className="group focus:outline-none transition-transform active:scale-90">
                                <Star className={`w-10 h-10 transition-colors ${rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-700 group-hover:text-slate-500'}`} />
                            </button>
                        ))}
                    </div>
                </div>
                {rating > 0 ? (
                    <div className="animate-fade-in-up flex flex-col items-center gap-3">
                        <button onClick={handleBlindRatingSubmit} className="px-10 py-4 bg-white text-[#020617] rounded-[24px] font-black text-lg hover:bg-indigo-400 hover:text-white transition-all shadow-xl">Submit Rating</button>
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">Ratings reveal simultaneously</p>
                    </div>
                ) : (
                    <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">Select stars to submit</p>
                )}
            </>
        ) : !ratingsRevealed ? (
            <div className="flex flex-col items-center gap-6 py-8">
                <Lock className="w-12 h-12 text-indigo-400 animate-pulse" />
                <div>
                    <h3 className="text-2xl font-black text-white mb-2">Rating locked in.</h3>
                    <p className="text-slate-400">Waiting for the other party to submit...</p>
                </div>
                <div className="flex gap-2 mt-4">
                    {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </div>
            </div>
        ) : (
            <div className="space-y-8 animate-fade-in-up">
                <div>
                    <h3 className="text-3xl font-black text-white mb-1">Both ratings revealed.</h3>
                    <p className="text-slate-400 text-sm">Neither party could influence the other's score.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    <div className="bg-indigo-900/30 border border-indigo-500/20 rounded-[24px] p-6 text-center">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Your Rating</p>
                        <div className="flex justify-center gap-1 flex-wrap">
                            {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-6 h-6 ${rating >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />)}
                        </div>
                    </div>
                    <div className="bg-emerald-900/30 border border-emerald-500/20 rounded-[24px] p-6 text-center">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Their Rating</p>
                        <div className="flex justify-center gap-1 flex-wrap">
                            {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-6 h-6 ${partnerRating >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />)}
                        </div>
                    </div>
                </div>
                <HoldButton key="btn-4" onClick={handleNextStep} label="Commit & Close" className="btn-primary-hold w-full max-w-md mx-auto bg-white text-[#020617] py-6 rounded-[32px] font-black text-xl shadow-xl" disabled={status !== 'idle'} />
            </div>
        )}
        {!paymentDelayed && !isCancelled && !blindRatingSubmitted && (
            <div className="flex justify-center mt-4">
                <button onClick={() => setShowPaymentDelay(true)} className="px-4 py-2 rounded bg-yellow-600 text-white font-bold hover:bg-yellow-700 transition-all text-sm">Simulate Payment Delay</button>
            </div>
        )}
    </div>
);

export default ContractStep4;
