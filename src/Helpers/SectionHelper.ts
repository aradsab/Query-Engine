import Course from "../Model/Course";
import Section from "../Model/Section";
import { InsightError } from "../controller/IInsightFacade";

export default class SectionHelper {
	private defaultYear = 1900;
	public addSections(inputCourses: Awaited<Buffer>[], courseNames: string[]): Record<any, any> {
		let sectionCount = 0;
		let i = 0;
		const courses: Record<string, Course> = {};
		for (const course of inputCourses) {
			const courseJsonString = new TextDecoder().decode(course);
			const courseJson: Record<string, any> = JSON.parse(courseJsonString);
			courses[courseNames[i]] = new Course(courseNames[i]);
			for (const eachSection of courseJson.result) {
				sectionCount++;
				let year = eachSection.Year;
				if (eachSection.Section === "overall") {
					year = this.defaultYear;
				}
				const section: Section = new Section(
					eachSection.Avg,
					eachSection.Pass,
					eachSection.Fail,
					eachSection.Audit,
					year,
					eachSection.Subject,
					eachSection.Course,
					eachSection.Professor,
					eachSection.Title,
					eachSection.id
				);
				courses[courseNames[i]].push(section);
			}
			i++;
		}
		if (sectionCount === 0) {
			throw new InsightError(`courses has no course`);
		}
		return { datas: courses, numRows: sectionCount };
	}

	public makeJobForCourses(files: Record<string, any>, jobs: any[]): string[] {
		let isFirst = true;
		const courseNames: string[] = [];
		for (const coursePath of Object.keys(files)) {
			if (isFirst) {
				isFirst = false;
				continue;
			}
			jobs.push(files[coursePath].async("arraybuffer"));
			const courseName: string = coursePath.toString().split("/")[1];
			courseNames.push(courseName);
		}
		return courseNames;
	}

	public addData(numSection: number, resultSections: any, section: any): number {
		resultSections.push(section);
		numSection++;
		return numSection;
	}
}
