import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export default async function chunkWikipediaExtract(extract: string) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    // TODO tweak these and check values
    chunkOverlap: 0,
  });

  const documents = await splitter.createDocuments([extract]);
  return documents.map((document) => document.pageContent);
}

/**
 * Below is an example of what the wikipedia extracts look like. They lend themselves nicely to chunking around the sections, which have \n\n== as a separator.
 * The RecursiveCharacterTextSplitter is a good fit for this
 *
 *
 * == Incidents ==
 * In April 2022, the San Francisco Police Department (SFPD) stopped a Cruise AV for driving at night without its headlights on. The AV was empty, operating without any human safety attendants or passengers. The vehicle pulled over for SFPD ahead of an intersection, then proceeded across the intersection when an officer walked away from it; on the other side of the intersection, the vehicle stopped again and turned on its hazard lights. According to Cruise, the vehicle operated as intended, moving to the "nearest safe location" for the traffic stop in response to direction from Cruise personnel after the SFPD officer was clear of the vehicle.Also in April 2022, an empty Cruise AV blocked the path of a San Francisco Fire Department (SFFD) truck responding to a fire at approximately 4 AM; the fire truck was unable to pass a garbage truck doubled-parked in the lane by using the lane for oncoming traffic, as the AV was occupying the oncoming lane. The Cruise AV had stopped and yielded to the fire truck, but was unable to pull to the right to clear the oncoming lane because of parked cars. While a human might have reversed to clear the lane, the Cruise AV did not move out of the way of the fire truck. San Francisco city officials filed a report to the California Public Utilities Commission (CPUC), stating that "this incident slowed SFFD response to a fire that resulted in property damage and personal injuries."On June 3, 2022, a Cruise AV taxi carrying three backseat passengers was involved in an accident with a Toyota Prius after making an unprotected left turn. According to Cruise, "occupants of both vehicles received medical treatment for allegedly minor injuries". According to GM, the Prius was speeding at the time of the accident and was in the wrong lane. In the aftermath of the incident, Cruise temporarily changed the vehicles' programming to make fewer unprotected left turns.On June 29, 2022, nearly twenty Cruise AVs blocked traffic for two hours by clustering at the intersection of Gough and Fulton near Golden Gate Park in San Francisco. A Cruise employee sent an anonymous letter to the CPUC, asserting that Cruise loses communication with the automated vehicles "with regularity", sometimes requiring a tow truck for recovery. Additional documented occurrences of immobilized Cruise vehicles in 2022 include May 18 (fleet-wide communications loss), June 21 (Tenderloin), and September 22 (two incidents; one near Sacramento and Leavenworth, the other near Geary and Franklin). San Francisco has recorded 28 incidents reported by 9-1-1 involving autonomous vehicle failures between May 29 and September 5, 2022.: 4, 31  In October 22, US News and World Report reported that Cruise autonomous taxis had blocked traffic in San Francisco on several occasions.  In March 2023, two of Cruise's passengerless-AVs drove through a blocked off intersection in San Francisco, and got tangled with Muni's power lines. The next day, a passengerless Cruise AV rear ended a Muni bus on Haight Street.In June 2023, a video was taken of a Cruise car appearing to block police and fire services from responding to a mass shooting in San Francisco. Cruise denied that the car had blocked the road, stating that emergency response vehicles "were able to proceed around our car". The police and fire departments declined to comment.
 *
 *
 * === Investigations ===
 * The National Highway Traffic and Safety Administration opened preliminary investigation PE22-014 on December 12, 2022, citing incidents in which the vehicles may have engaged "in inappropriately hard braking or [became] immobilized". Two letters were sent to Cruise on January 4, 2023, requesting relevant data. The city of San Francisco wrote to the CPUC that month, requesting that an application to expand commercial operating hours be denied: "in the months since the Initial Approval [of autonomous taxi services in June 2022], Cruise AVs have made unplanned and unexpected stops in travel lanes, where they obstruct traffic and transit service, and intruding into active emergency response scenes, including fire suppression scenes, creating additional hazardous conditions."
 *
 *
 * == See also ==
 * Self-driving car
 * Shared autonomous vehicles
 */
