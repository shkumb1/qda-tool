import type { Code, Theme, QDADocument, CodeExcerpt } from "@/types/qda";
import { v4 as uuidv4 } from "uuid";

// Dataset: Facebook comments about childfree choices
// Source: Thematic Analysis: A Practical Guide (Braun & Clarke 2021)
// Context: Seven Sharp (NZ current affairs show) Facebook discussion about adults choosing not to have children

export const SAMPLE_DOCUMENTS: Omit<
  QDADocument,
  "id" | "uploadedAt" | "excerpts"
>[] = [
  {
    title: "Childfree Discussion - Part 1",
    type: "txt",
    size: 3519,
    content: `META (Comment):
People should just respect other's choices, we all choose our own paths.

CAHO (Reply):
Having had three kids and two stepkids I say get a dog.

DEMO (Reply):
I’m the same I now have two dogs, nine grandchildren.

FIMA (Comment):
Why do people think it's selfish not having children? It's no one else's business!!

CHCA (Comment):
Why do people assume that choosing to be childfree automatically means that you won't have children in your life? My partner and I have decided not to have kids for a range of personal, environmental and social reasons. But I am a Godmother, an aunt, an older cousin, and a friend to many children. Contrary to common misconception those who choose not to have kids are rarely lonely, just more self-aware. In many cases those who choose not to have kids have usually thought a lot more about that decision than those who reproduce.

DARE (Reply):
Very, very well said. Clearly you have never had baby brain.

MACL (Reply):
And conversely, in many cases those who choose to have children have thought a lot more about that decision than those who choose not to have children. We're an ageing society … And I think parents are pretty self aware as our children's behaviour is reflected right back at us. For better or for worse.

GRKO (Comment (Edited)):
Let’s not forget those who would die to have kids of their own, but for one reason or another can’t …

DARE (Reply):
Agreed. The pity is there's no shortage of people who shouldn't have kids. Should almost have to take a pill TO have a kid.

SHHA (Comment):
I think you have to want to and be prepared for the challenge ahead. Those who don’t have kids might have other goals they want to achieve good for them I’m not hating and I wouldn’t change my life for anything my daughter did it for me and I am grateful [smiley face emoji]

MAMC (Reply):
Not many people plan to have kids hehe and when they plan it usually doesn’t happen [smiley face emoji]

NAMI (Comment):
It's selfish to spread your legs and expect everyone else to pay for your kids through welfare!!! Why should I pay for someone else's kids when I choose not to have any of my own. I'm tired of being taxed and seeing it go to someone who doesn't deserve it … But I also see families that do need help and do deserve it.

TIJA (Reply):
Hear hear! Agree totally!

BRMA (Comment):
Better not to have kids than have trophy kids and dump them in childcare from seven am to six pm every day and then say I'm too busy to come to special events. Poor sprogs, selfish parents.

HATU (Reply):
Yep seen plenty of those kids, in fact seen a lot of very bad parenting along the way too, gosh it frightens me at these kids are going to be the next generation, bunch of spoilt brats!! By the way I have three well rounded kids and love being a mum!!

SARO (Comment):
Some people are child orientated, others aren't. It’s as simple as that.

SARO (Comment):
It’s also a lifestyle choice people make, more money and luxury, or the ups and downs a family brings along with different social skills needed.

RITA (Comment):
My wife and I are not having kids, we do what we want, when we want how we want … and we always have money … always.`,
  },
  {
    title: "Childfree Discussion - Part 2",
    type: "txt",
    size: 4217,
    content: `CLPR (Comment):
Grandkids are your reward for not strangling your kids.

JOWI (Comment):
My husband and I chose not to have children and have never regretted this decision. The majority of our friends have no children and we all have brilliant fulfilled lives. It is a personal choice, respect it!

SAWH (Comment):
No kids for us and we are fine with that it's our choice!!! I laugh when people say there won't be anyone to look after us when were old, because let's face it people how many of you are really going to look after your ageing parents and by that I mean not putting them in a rest home!!!

ANLI (Reply):
I will look after mine. They are amazing parents and it's the least I can do. Tis the natural order.

DARE (Reply):
It’s a sad old argument isn't it? That I should breed humans to take care of me in my old age? Absolute pish.

SAWH (Comment):
Don't get me wrong my parents have been amazing but me having to care for them when they can't I'm sorry but I'm honest it's not for me!

HEWI (Comment):
Don't have kids and do not regret our decision not to! … But love our nieces and nephews to bits!

JAOB (Comment (Edited)):
Children AREN'T for everyone … never have been. It's purely a personal choice and some people who choose to become parents should have thought far more about WHY they had their children. I love my children, but they have always been loved and cared for, fed, clothed and taught well. This is not always the case.

GLSH (Comment):
Isn't it funny how most of the judgemental comments seem to be coming from people with kids. I cannot understand why we cannot all respect each other’s decisions, each to their own I say.

JATH (Comment):
I am nearly thirty-nine years old. I have no children and that was by choice. Never wanted any, never will. I have nieces and nephews that I love. I have had other females tell me I must be abnormal and weird and it makes me steam. I’ve got my own mind and I will do as I want. And nothing I do, or will do in the future involves having kids. No way.

RITA (Comment):
Five point three billion humans on this planet putting it under so much pressure … so really … who's being selfish.

PADU (Comment):
We had decided not to have children, until oops we got pregnant. Was the best thing we ever did, we were both in our thirties so decided just to have the one. I wish we had done it earlier so we could have had more. Anyway feel so blessed to have our one son [smiley face emoji]

KAHA (Comment):
My husband and I don’t have kids and don’t want kids. We're happy being the aunty and uncle who buys the cool gifts.

JOAS (Comment):
I never wanted kids … Then my first was born … He was so perfect, such a miracle that I made a human wow!I thought I knew love but he showed me what it really felt to love someone with all the love I had. Now I have three and as stressful as it can be it's amazing.I am never lonely, I'm loved everyday, I have a purpose in life.Sure it would be great to be rich but love is worth more than any material object on earth.I didn't want kids but I'm glad I accidentally got pregnant. It's one if those things you don't know what you were missing until you have it [smiley face emoji]

EVDO (Comment):
Well that was one sided … As is the situation. Women who don't want children are the ones being judged! Seems that it's okay if a man doesn't want children, but you're seen as less of a woman if you don't want them.

PAMA (Comment):
The world is so over populated already, so if people choose not to have kids, they are not being selfish at all. Maybe having lots of kids is the selfish thing these days …? Each to their own I say.

ALBR (Comment):
Good on you if you have kids and good on you if you don't! No screaming menace small humans for me anytime soon.

JAWE (Reply):
"screaming menace small humans" shit I wonder where on earth you were brought up [sad face emoji]`,
  },
  {
    title: "Childfree Discussion - Part 3",
    type: "txt",
    size: 7337,
    content: `CLGR (Reply):
^ Usually people like you that have those kids.

ALBR (Reply):
Haha JAWE … I was brought up about an hour north of Auckland. I was taught manners, to be respectful to all beings and to be non judgmental. I was brought up very very well I’ll have you know.

MAHA (Comment):
We don't have children through choice, neither are we wage slaves. I am forty-six and at no stage have I regretted being childless. It feels normal for us. What doesn't feel normal is the inability of others to accept our choice. Personally I made the choice at the age of thirty. It was an expectation that was placed upon me by others and myself that I would be a mum. It was such a relief to me when I made the choice.

MARM (Reply):
I call myself “childfree” rather than “childless” I think it sounds more positive [smiley face emoji]

ZAJO (Comment (Edited)):
A relationship without kids sucks! Grow up people. Only people who have no confidence and can't handle responsibilities will prefer no kids! You were a kid one day and a couple “your parents” brought you to this life, you didn't come from nowhere. Kids makes life more enjoyable and will learn how to handle responsibility. If you know how to raise them up. You will have someone later who will clean your shit and take care of you when you grow older. No career and no money and no travel will benefit you when you are OLD. It's your kids who you raised up properly and spent quality time with them will benefit you. What do you want a couple working like robots and earning money? This is DISGUSTING. There is no life without kids! People who cannot handle kids are MENTAL and they need help. There is no bad children, it's US who can raise them up good or bad and it's the parents’ responsibility. Coming back from work and finding your little ones waiting - worth more than a career and money and travel.

DARE (Reply (Edited)):
"You will have someone later who will clean your shit and take care of you when you grow older." Boy, that's a considered approach to bringing a child into the world. Is that what you've told your kids they have to look forward to? Is that the aspirations you have for your children? To be the ass wipers of the previous generation? THAT'S DISGUSTING. "There is no bad children …" Really? What colour candyfloss is the sky made of in your world? Bailey Junior Kuariki (twelve), Teina Pora (seventeen) - ring any bells? Spin your rhetoric to their victims, I dare you. Go sit on the timeout step and think about what you've just said. You're clear evidence that the ability to breed doesn't mean it should happen.

MARM (Reply):
Sad that you think children are the only thing worth living for especially if when the time comes (and you’ve spent all your time and money on them) they put you in a home and never visit.

KIFO (Comment):
Everyone has the right to choose how to live their life. It’s not unnatural, unloving or selfish. It’s a very personal decision - great story thanks!

MIBE (Comment):
Feel for those men and women who really want children but can't have them. I'm delighted for men and women who love children and enjoy being parents, despite the additional pressures and trials they go though. It disgusts me when anyone judges, condemns or questions a man or woman's decision to not have children. Someone earlier mentioned "the one with the uterus decides". I do believe the man in a partnership should have some say, after all it's a massive, long term, and costly role being a parent, and teamwork makes any job easier. ;-) I personally like the idea of being a parent but recognised very early on that I had too much of a temper, and that my moods were too up and down. I seriously looked at myself like giving myself a warrant of fitness for parenting, and declined the warrant. Twenty years on, having learnt about myself and how I work, I'm in a position to help my friends significantly by caring for their kids for school holidays and when they're struggling. It gives me immense pleasure to help friends and to be part of these growing individuals … but I've never doubted my decision all those years ago. Marrying a man with an existing vasectomy protected me from my own body's urges to reproduce. I'm grateful that I had that foresight. I suspect I would be a mother of two at very least if not for that. I make an awesome part time, respite care mum, but I know my limits. There are so many amazing parents out there. Sadly there are also some appalling parents out there. My only judgement on the world is that I wish more men and women would give themselves a warrant of fitness before becoming a parent. It's such a huge responsibility, and it's for a very long time. A very interesting read.

CAVI (Comment):
I don't see how this is newsworthy?

JEHA (Reply):
Seven Sharp isn't really a news programme … more like a social commentary that is sometimes about events that have been in the news … sometimes not.

ANMA (Comment):
Not my uterus, not my business! As long as you don't call me a “breeder” and make rude comments because I wanted kids young.

DEBA (Comment (Edited)):
My partner and I have been together thirty-two years - no children and we both love it! We are not shrivelled up selfish misfits! We have fur babies who we love to bits but who don't limit our enjoyment of the things we love doing. I am fifty-eight and still ride my horses - I am intending to compete my five year old next year and another baby the year after! In comparison to others of my age (who have had children) I have a life, I enjoy my sports I am very fit and strong and I look twenty years younger! What a great decision!

JOMC (Comment):
It's harder than we thought but worth it, for us! We've had our two daughters, just four and eighteen months old, later in life … I'm forty-seven and my partner is forty-one … So we did a lot of living, much of it selfish only worried about ourselves … So it is harder than we thought and there are changes we've had to make, but it's been our choice and we accept we'll be a bit older than many of our children's friends parents, but we are ready only now for this stage our of lives and they will keep us young! Life is all about choices, and we feel lucky we did in fact have this choice … Many don't.

JATH (Comment):
I hear that!!! It pisses me right off when I get told "you'll change your mind" like I don't know my own thoughts. I "know" what I do and don't want. And I definitely didn't want to raise bloody kids!!!

CLGR (Comment (Edited)):
I'm so sick of people saying, "You'll change your mind" when I say I don't want kids. I want to travel, have a career and have nice things so no kids for me.

SUHA (Comment):
I’m forty-five years old and never wanted kids, but have ended up with three stepkids … Love my man enough to live with his kids [smiley face emoji]

TIJA (Reply):
Similar situation for me too SUHA. my wife came with three adult stepkids and two grandies. They are great, but drive us nuts at times too!`,
  },
  {
    title: "Childfree Discussion - Part 4",
    type: "txt",
    size: 6706,
    content: `WAFL (Comment):
Some couples can't have kids; no choice involved, it's just fate …

MAEL (Comment):
I have one beautiful boy, I only ever wanted one and I love him to pieces … I now have three additional stepsons, we have our ups and downs but do I regret it? Gosh no, they all (including my own) drive me CRAZY some days and I need time out, but isn't that parenting? I would not change things, however, I do not judge those who chose not to. It is our right to choose what is right for us and it could be kids, it may be the child free life. Rather we make the right decision than one that you cannot alter (for example, having kids you don't want) and then make the WRONG decisions.

WAMO (Comment):
I know at least a dozen kiwi guys in their forties who would love to find someone kiwi to settle down and have kids with, but it's unfortunate the only ones who want to do that are foreigners … Generations of kiwi women wanting to be men, or trying to be solo mum as paid full time employment, because it's equal to man’s job in pay, have killed the traditional family structure of this society.These childless couples will just depend on everyone else’s kids for welfare when they get older!

RALA (Reply):
After earning their own money and paying their taxes for years? Are they not entitled to do so? Plenty of people out there having kids who have never paid a cent towards society but feel free to bleed it dry so this argument goes both ways!

HEST (Reply):
– Or WAMO - these childless couples have actually had successful careers, provided for themselves, contributed endlessly to society through their taxes or volunteering in, supporting education, healthcare and welfare which they haven't needed to use because they pay for it privately. We still choose to support our society because we want to live in an amazing country that provides endless opportunity (and believe me this country offers plenty of it!). Everyone has choices … use your human rights and personal values to make conscious decisions - people need to accept their choices and not contribute to a blame culture.

MARM (Reply):
Hey, I pay my taxes for other people’s kids to use for example, education, healthcare, welfare etcetera. so they can support me in my (childfree) old age.

CHSO (Comment):
Love love love my kids, they drive me insane sometimes, but wouldn't want it any other way, never have enough money but they always make me smile (LOL, most of the time!!!!!!) I would be totally lost without them.

JHOR (Comment):
Everyone loves "making" them though aye?

LIMC (Comment):
Definitely a personal/relationship choose!! And I don't think anyone should judge another person’s choice for having kids or not!! I have four beautiful kids and that was my choice in life! I also know many who have chosen not to have kids. “Each to their own” no biggie. No debate really.

RADE (Comment):
I wish I could have children but I can't because I have a rare syndrome called Cri Du Chat or Cry of the Cat or 5P- or CDC for short but I am a mosaic which means some of my cells are affected. I can pass on my syndrome to my children and I have seen first-hand what my syndrome can do and I don't want that for my children. I love children and I volunteer at the YMCA two mornings a week. I also have two wonderful nephews and a niece as well and adoption is out of the question and I have a kitten called Fanta and she is my fur baby and she adores my partner to pieces also. When he comes over to see me she will run to him and purr. Before you judge anyone on not wanting children maybe just listen to their story of why they don't want children or just can't have them.

WESK (Comment):
To have kids, or to not have kids, it's each person’s decision to make, and only their decision. No one has the right to try force either choice. Good on those who do, and good on those who don't.

JAKE (Comment):
Kids or no kids. Just be happy.

DIWH (Comment):
Having children will test and teach you things that you never knew about yourself. I respect anyone's decision not to have children. We had children young, we only brought our house four years ago, brought a business one year ago and we only just took our children on their first overseas holiday, oldest child being almost fourteen. After twenty years it has been a tough road, but it is about relationships and not about the money and how far you are going to get in life without kids, at the end of the day you can't take all that with you. We can all make choices, but my kids will be in the workforce in the next ten years working ten times harder than anyone right now to support the ever so aging population with no kids! … No offence to anyone of course, but it is the reality. Start saving!

DARE (Reply (Edited)):
Congratulations on what you've achieved, but what tired rhetoric you've bought into - like so many others. By the time my generation retires, taxes paid now or in the future won't even provide a dry biscuit. If you believe otherwise, you haven't been listening to the economists and social commentators telling us we can no longer rely on the government social system funded by taxes. Don't think for a moment that the present generation breeding does the retiring-generation-in-waiting any favours - certainly not to the point where they should be grateful. Only places stress on (and creates competition for) the resources, services and infrastructure they each have to share. I'm afraid it is about the money as much as the quality of life you want to enjoy throughout life as much as towards the end of it.

MEFO (Comment):
I am proud to say I never want kids. I respect those who do and have. It's a personal choice. What difference does it make to YOU (society) if there are people out there who don't want kids? I don't go round calling people who have had kids weird, so what gives YOU the right to make that judgement?!

JOWI (Comment):
And as my husband says, unfortunately there are a number of wee ones out there whose parents don't appreciate them that we may be able to help if we change our minds or if one needs us.

DOAT (Comment):
I have chosen not to have kids, I even had to fight with the health system to have my tubes tide. I enjoy my life and don't regret it.

SIMA (Comment (Edited)):
The world has far too many people! Good on those who don't want kids they should be applauded.`,
  },
  {
    title: "Childfree Discussion - Part 5",
    type: "txt",
    size: 5004,
    content: `BRDU (Comment):
There are folks who would love to have children but nature is against them. Having science to intervene can be okay if you can afford it but for others just take things in their stride and enjoy the company of nieces and nephews which means a lot. I am okay with this and we just have each other me and my guy.

JOBR (Comment):
Um SUST some of us would love to have the choice.

SHHO (Comment):
It’s a choice, why have kids if you can’t afford them. Too many hungry children going to school without food.

JAWE (Reply):
Speaking of going to school!!! did you?

KEWI (Comment):
To have babies or not to have babies?That is the real question.How about meeting couples who are childless and hating it.

DIWO (Comment):
ZAJO you are the biggest loser I have ever heard, you obviously have a fear of being alone. Child free is great! I love kids, but do not have any, I shouldn't be made to feel bad because I have none.

KIJU (Comment):
It's a choice.If someone wants or doesn't want them, respect that.

AMAY (Comment):
Each to their own I say [smiley face emoji] I’m not sure why it would the business of anyone else to judge why or why not you will or won't have children. My husband and I have three children and for us, our life feels completed with them. It’s the little things that I couldn't imagine experiencing without them. Things that only a parent will notice [smiley face emoji] I am very happy with my choice to have my beautiful children [smiley face emoji]

VIQU (Comment):
A complete non-story. Did it have any point?

JEHA (Reply):
Not really a story, more a point on the pressures of modern society.

ANWH (Comment):
My partner and I decided long ago we didn’t want kids. I have nieces I love to bits but I still don’t want my own kids. I’ve seen people have kids and regret it and others who have them and don’t regret it so I say each to their own.

SYCO (Comment):
If people chose not to have kids, NOBODY has the right to judge them … having no kids definitely doesn't make a person less significant in this world nor does having kids makes a person more significant.

DARE (Comment (Edited)):
Baby brain and a life of servitude? No thanks. World's full of sheep (followers) and breeders - often difficult to tell the difference. Would like to think my intelligence extends past breeding. Selfish to choose not to have children? I call it considered. No more selfish than the breeder-centric systems in society that provide preferences and benefits for breeders.Parental leave and tax breaks?? - what happened to planning? How is it right that an employer has to make arrangements and keep the role because of a choice someone makes? Doesn't happen if I want to do something. And why do my taxes pay for your decision to breed?Domestic leave is of little use to anyone without children. Where's my opportunity to be away from work because my rat (that I chose to have) has a runny nose?Hundreds of thousands in student loans are dished out, seemingly without a requirement to pay it back when the recipient decides to bugger off overseas. Where is my opportunity to rort a similar system. Good on you parents for instilling your values of obligation. Who picks up the tab? We all do. And don't tell me I should be grateful for today’s children keeping me in my old age - fiscally or physically. What old-thinking and flawed rhetoric. Is that a reason for breeding? is that what a child has to look forward to? THAT'S selfish. I prefer (and feel an obligation) to exercise some personal responsibility.We have been told time and again that the taxes paid now and in the future won't be sufficient to keep us so we need to make provisions for ourselves. Increased population only serves to put pressure on resources and services - basic economics. If you believe otherwise you haven't been paying attention to the economic forecasters and social commentators.

ANBE (Comment):
It's YOUR life - do what YOU want!!! What's right for one isn't necessarily right for another! [smiley face emoji]

CHOY (Comment):
I was eighteen when I had my first and ten months later I had another one. By the time I was twenty-six I had four children. Then when I was thirty-eight I had another and forty-one I had my last son. I love children. But I can see why people don't want children today. It is their choice.

ROAR (Comment):
Get divorced, best of both worlds.

DARE (Reply (Edited)):
Or save the lawyer’s fees and find someone you hate, buy them a house and give them half your stuff. ha haaaa.

PEAU (Comment):
Other people's kids will one day fund my retirement with their taxes. I'm very grateful for their future contribution.`,
  },
];


export const SAMPLE_CODES: Omit<Code, "id" | "createdAt">[] = [];

export const SAMPLE_THEMES: Omit<Theme, "id" | "createdAt">[] = [];

export function loadSampleData(
  addDocument: (
    doc: Omit<QDADocument, "id" | "uploadedAt" | "excerpts">,
  ) => void,
  addCode: (name: string, parentId?: string, level?: Code["level"]) => Code,
  addTheme: (name: string, color: string, parentId?: string) => Theme,
) {
  // Add sample documents
  SAMPLE_DOCUMENTS.forEach((doc) => {
    addDocument(doc);
  });

  // Add sample codes
  SAMPLE_CODES.forEach((code) => {
    addCode(code.name, undefined, code.level);
  });

  // Add sample themes
  SAMPLE_THEMES.forEach((theme) => {
    addTheme(theme.name, theme.color);
  });
}
