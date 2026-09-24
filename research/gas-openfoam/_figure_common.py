import json, numpy as np, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import rcParams
from matplotlib.ticker import AutoMinorLocator
rcParams.update({
 'font.family':'sans-serif','font.sans-serif':['Arial','Helvetica','DejaVu Sans'],
 'axes.labelsize':18,'xtick.labelsize':15,'ytick.labelsize':15,'legend.fontsize':14,'font.size':14,
 'axes.linewidth':1.2,'xtick.direction':'in','ytick.direction':'in','xtick.top':True,'ytick.right':True,
 'xtick.major.size':6,'ytick.major.size':6,'xtick.minor.size':3,'ytick.minor.size':3,
 'xtick.major.width':1.2,'ytick.major.width':1.2,'xtick.minor.width':0.9,'ytick.minor.width':0.9,
 'legend.frameon':False,'savefig.facecolor':'white','figure.facecolor':'white',
 'svg.fonttype':'none','mathtext.default':'regular'})
S="../"; ES="../es/docs/figures/"
def J(p): return json.load(open(p))
def vir(n): return plt.cm.viridis(np.linspace(0.85,0.1,n))
def letter(ax,s,x=0.03,y=0.97): ax.text(x,y,s,transform=ax.transAxes,fontsize=18,fontweight="bold",va="top",ha="left")
def minor(*axs):
    for ax in axs:
        if ax.get_xscale()=="linear": ax.xaxis.set_minor_locator(AutoMinorLocator(2))
        if ax.get_yscale()=="linear": ax.yaxis.set_minor_locator(AutoMinorLocator(2))
def figcheck(fig,tol=1.0):
    """Machine check before save: text outside the figure or its axes, text overlapping text,
    schematic text spilling out of the box that contains its centre. Returns a list of problems."""
    from matplotlib.patches import FancyBboxPatch, Rectangle
    from matplotlib.text import Text
    from matplotlib.legend import Legend
    fig.canvas.draw(); r=fig.canvas.get_renderer(); probs=[]
    fb=fig.bbox
    def bb(a):
        try: return a.get_window_extent(r)
        except Exception: return None
    for ax in fig.axes:
        ab=ax.get_window_extent(r); ab=ab.expanded(1.0,1.0)
        texts=[t for t in ax.texts if t.get_text().strip()]
        xl=ax.get_xlim(); yl=ax.get_ylim()
        for tk in ax.xaxis.get_major_ticks():
            if min(xl)<=tk.get_loc()<=max(xl) and tk.label1.get_visible() and tk.label1.get_text().strip(): texts.append(tk.label1)
        for tk in ax.yaxis.get_major_ticks():
            if min(yl)<=tk.get_loc()<=max(yl) and tk.label1.get_visible() and tk.label1.get_text().strip(): texts.append(tk.label1)
            if min(yl)<=tk.get_loc()<=max(yl) and tk.label2.get_visible() and tk.label2.get_text().strip(): texts.append(tk.label2)
        texts+= [ax.xaxis.label,ax.yaxis.label]
        if ax.get_legend(): texts+= ax.get_legend().get_texts()
        boxes=[p for p in ax.patches if isinstance(p,(FancyBboxPatch,Rectangle)) and p.get_width()>0]
        for t in texts:
            b=bb(t)
            if b is None: continue
            if b.x0<fb.x0-tol or b.x1>fb.x1+tol or b.y0<fb.y0-tol or b.y1>fb.y1+tol: probs.append(f"outside figure: '{t.get_text()[:40]}'")
            if t in ax.texts and t.get_clip_on() is False and not ax.axison:
                cx,cy=(b.x0+b.x1)/2,(b.y0+b.y1)/2
                for p in boxes:
                    pb=bb(p)
                    if pb and pb.contains(cx,cy):
                        if b.x0<pb.x0-tol or b.x1>pb.x1+tol or b.y0<pb.y0-tol or b.y1>pb.y1+tol: probs.append(f"spills out of box: '{t.get_text()[:40]}'")
        ann=[t for t in ax.texts if t.get_text().strip()]
        if ax.get_legend(): ann.append(ax.get_legend())
        for i in range(len(ann)):
            for j in range(i+1,len(ann)):
                a,b2=bb(ann[i]),bb(ann[j])
                if a and b2 and a.overlaps(b2):
                    ov=min(a.x1,b2.x1)-max(a.x0,b2.x0); ovy=min(a.y1,b2.y1)-max(a.y0,b2.y0)
                    if ov>3 and ovy>3:
                        na=ann[i].get_text()[:30] if isinstance(ann[i],Text) else "legend"; nb=ann[j].get_text()[:30] if isinstance(ann[j],Text) else "legend"
                        probs.append(f"overlap: '{na}' x '{nb}'")
    import re
    HUB=r"\b(robust|seamless|crucial|leverage|showcase|ensure|comprehensive|powerful|novel|key|critical|breakthrough|elegant|simply|clearly|in practice|which is why|proxy|lever)\b"
    for ax in fig.axes:
        strs=[t.get_text() for t in ax.texts]+([t.get_text() for t in ax.get_legend().get_texts()] if ax.get_legend() else [])+[ax.get_xlabel(),ax.get_ylabel()]
        for st in strs:
            if re.search(HUB,st,flags=re.I): probs.append(f"diction: '{st[:50]}'")
            if re.search(r"\bthe \w+, the \w+,? and the \w+",st) or st.count("—"): probs.append(f"triad or em dash: '{st[:50]}'")
    return probs
def save(fig,name,strict=True):
    fig.tight_layout(pad=0.5)
    probs=figcheck(fig)
    if probs:
        print("FIGCHECK",name); [print("  -",p) for p in probs]
        if strict: raise SystemExit(f"{name}: {len(probs)} layout problem(s); not saved")
    fig.savefig(name+".png",dpi=600); fig.savefig(name+".svg"); print("saved",name,"(figcheck ok)")
def bands(ax,ar,cons,lo=0.1,hi=1000):
    cmap={"Current":"#e4ecf5","Voltage":"#f8e3df","Power":"#e6f2e8","Current density":"#eeeeee"}
    ar=np.asarray(ar); edges=[lo]+[float(np.sqrt(ar[i]*ar[i+1])) for i in range(len(ar)-1)]+[hi]
    i=0
    while i<len(cons):
        j=i
        while j+1<len(cons) and cons[j+1]==cons[i]: j+=1
        ax.axvspan(edges[i],edges[j+1],color=cmap.get(cons[i],"#eee"),lw=0,zorder=0); i=j+1
